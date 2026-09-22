import { useEffect, useRef } from "react";
import type { Socket } from "socket.io-client";
import { fetchIceServers } from "../lib/webrtc-config";
import { useCallStore } from "../store/callStore";
import type { PeerInfo, SignalData } from "../types";

interface PeerConnState {
  pc: RTCPeerConnection;
  pendingCandidates: RTCIceCandidateInit[]; // queued until remote description is set
}

// call join-room (with displayName/preferredLang) from the join-flow component BEFORE
// mounting this hook — this hook only wires up peer connections once in the room
export function useWebRTC(socket: Socket, roomCode: string | null) {
  const connectionsRef = useRef<Map<string, PeerConnState>>(new Map());
  const iceServersRef = useRef<RTCIceServer[]>([{ urls: "stun:stun.l.google.com:19302" }]); // safe default until fetched
  const localStream = useCallStore((s) => s.localStream);
  const { addRemoteStream, removeRemoteStream, addPeer, removePeer, setStatus } = useCallStore();

  // create (or return existing) peer connection for a given remote socket
  const getOrCreateConnection = (targetSocketId: string): PeerConnState => {
    const existing = connectionsRef.current.get(targetSocketId);
    if (existing) return existing;

    const pc = new RTCPeerConnection({ iceServers: iceServersRef.current });
    const state: PeerConnState = { pc, pendingCandidates: [] };
    connectionsRef.current.set(targetSocketId, state);

    localStream?.getTracks().forEach((track) => pc.addTrack(track, localStream));

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit("signal", {
          roomCode,
          targetSocketId,
          data: { type: "ice-candidate", candidate: e.candidate.toJSON() } satisfies SignalData,
        });
      }
    };

    pc.ontrack = (e) => {
      addRemoteStream(targetSocketId, e.streams[0]);
    };

    // ICE restart handles transient network drops (wifi->mobile switch, brief packet loss)
    // rather than tearing down and rebuilding the whole connection
    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === "failed" || pc.iceConnectionState === "disconnected") {
        setStatus("reconnecting");
        pc.restartIce();
      } else if (pc.iceConnectionState === "connected") {
        setStatus("connected");
      }
    };

    return state;
  };

  const createOffer = async (targetSocketId: string) => {
    const { pc } = getOrCreateConnection(targetSocketId);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socket.emit("signal", {
      roomCode,
      targetSocketId,
      data: { type: "offer", sdp: offer } satisfies SignalData,
    });
  };

  const handleSignal = async (fromSocketId: string, data: SignalData) => {
    const { pc, pendingCandidates } = getOrCreateConnection(fromSocketId);

    if (data.type === "offer") {
      await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
      // flush any ICE candidates that arrived before remote description was ready
      for (const c of pendingCandidates.splice(0)) await pc.addIceCandidate(c);

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("signal", {
        roomCode,
        targetSocketId: fromSocketId,
        data: { type: "answer", sdp: answer } satisfies SignalData,
      });
    } else if (data.type === "answer") {
      await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
      for (const c of pendingCandidates.splice(0)) await pc.addIceCandidate(c);
    } else if (data.type === "ice-candidate") {
      if (pc.remoteDescription) {
        await pc.addIceCandidate(data.candidate);
      } else {
        pendingCandidates.push(data.candidate); // queue until remote description lands
      }
    }
  };

  const closeConnection = (socketId: string) => {
    const state = connectionsRef.current.get(socketId);
    state?.pc.close();
    connectionsRef.current.delete(socketId);
    removeRemoteStream(socketId);
  };

  useEffect(() => {
    if (!roomCode || !localStream) return;
    let cancelled = false;

    // I'm the new joiner — server tells me who's already here, I initiate offers to each
    const onExistingPeers = (peers: PeerInfo[]) => {
      peers.forEach((p) => {
        addPeer(p);
        createOffer(p.socketId);
      });
    };

    // someone else joined after me — I don't initiate, I just register them and wait for their offer
    const onPeerJoined = (peer: PeerInfo) => {
      addPeer(peer);
    };

    const onSignal = ({ fromSocketId, data }: { fromSocketId: string; data: SignalData }) => {
      handleSignal(fromSocketId, data);
    };

    const onPeerLeft = ({ socketId }: { socketId: string }) => {
      closeConnection(socketId);
      removePeer(socketId);
    };

    // fetch TURN creds before wiring up any listeners — avoids a race where an offer/answer
    // arrives and creates a peer connection using the stale STUN-only default
    fetchIceServers().then((servers) => {
      if (cancelled) return;
      iceServersRef.current = servers;

      socket.on("existing-peers", onExistingPeers);
      socket.on("peer-joined", onPeerJoined);
      socket.on("signal", onSignal);
      socket.on("peer-left", onPeerLeft);

      setStatus("connecting");
    });

    return () => {
      cancelled = true;
      socket.off("existing-peers", onExistingPeers);
      socket.off("peer-joined", onPeerJoined);
      socket.off("signal", onSignal);
      socket.off("peer-left", onPeerLeft);
      connectionsRef.current.forEach((state) => state.pc.close());
      connectionsRef.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomCode, localStream]);
}
