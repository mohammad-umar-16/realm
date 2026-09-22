import { create } from "zustand";
import type { ConnectionStatus, PeerInfo } from "../types";

interface CallState {
  status: ConnectionStatus;
  roomCode: string | null;
  localStream: MediaStream | null;
  remoteStreams: Map<string, MediaStream>; // socketId -> stream
  peers: Map<string, PeerInfo>; // socketId -> info
  micEnabled: boolean;
  camEnabled: boolean;
  ttsEnabled: boolean;

  setStatus: (s: ConnectionStatus) => void;
  setRoomCode: (code: string) => void;
  setLocalStream: (s: MediaStream | null) => void;
  addRemoteStream: (socketId: string, stream: MediaStream) => void;
  removeRemoteStream: (socketId: string) => void;
  addPeer: (peer: PeerInfo) => void;
  removePeer: (socketId: string) => void;
  toggleMic: () => void;
  toggleCam: () => void;
  toggleTts: () => void;
  reset: () => void;
}

export const useCallStore = create<CallState>((set) => ({
  status: "idle",
  roomCode: null,
  localStream: null,
  remoteStreams: new Map(),
  peers: new Map(),
  micEnabled: true,
  camEnabled: true,
  ttsEnabled: false,

  setStatus: (status) => set({ status }),
  setRoomCode: (roomCode) => set({ roomCode }),
  setLocalStream: (localStream) => set({ localStream }),

  addRemoteStream: (socketId, stream) =>
    set((s) => {
      const next = new Map(s.remoteStreams);
      next.set(socketId, stream);
      return { remoteStreams: next };
    }),

  removeRemoteStream: (socketId) =>
    set((s) => {
      const next = new Map(s.remoteStreams);
      next.delete(socketId);
      return { remoteStreams: next };
    }),

  addPeer: (peer) =>
    set((s) => {
      const next = new Map(s.peers);
      next.set(peer.socketId, peer);
      return { peers: next };
    }),

  removePeer: (socketId) =>
    set((s) => {
      const next = new Map(s.peers);
      next.delete(socketId);
      return { peers: next };
    }),

  toggleMic: () => set((s) => ({ micEnabled: !s.micEnabled })),
  toggleCam: () => set((s) => ({ camEnabled: !s.camEnabled })),
  toggleTts: () => set((s) => ({ ttsEnabled: !s.ttsEnabled })),

  reset: () =>
    set({
      status: "idle",
      roomCode: null,
      localStream: null,
      remoteStreams: new Map(),
      peers: new Map(),
    }),
}));
