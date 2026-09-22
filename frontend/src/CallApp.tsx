import { useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { JoinRoom } from "./components/Room/JoinRoom";
import { VideoGrid } from "./components/VideoCall/VideoGrid";
import { CallControls } from "./components/VideoCall/CallControls";
import { ConnectionStatus } from "./components/VideoCall/ConnectionStatus";
import { CaptionOverlay } from "./components/Captions/CaptionOverlay";
import { ChatPanel } from "./components/Chat/ChatPanel";
import { useSocketContext } from "./context/SocketContext";
import { useLocalMedia } from "./hooks/useLocalMedia";
import { useWebRTC } from "./hooks/useWebRTC";
import { useSpeechRecognition, isSpeechRecognitionSupported } from "./hooks/useSpeechRecognition";
import { useWhisperFallback } from "./hooks/useWhisperFallback";
import { translateText } from "./hooks/useTranslation";
import { useCallStore } from "./store/callStore";
import { useCaptionStore } from "./store/captionStore";
import { useChatStore } from "./store/chatStore";
import { useAuthStore } from "./store/authStore";
import { BCP47 } from "./lib/locale";
import type { CaptionUpdate, ChatMessage } from "./types";
import { nanoid } from "nanoid";

export function CallApp() {
  const [joined, setJoined] = useState(false);
  const [joinInfo, setJoinInfo] = useState<{ roomCode: string; displayName: string; preferredLang: string } | null>(
    null
  );

  const socket = useSocketContext()!;
  const { error: mediaError } = useLocalMedia(joined);
  const localStream = useCallStore((s) => s.localStream);
  const reset = useCallStore((s) => s.reset);
  const authUser = useAuthStore((s) => s.user);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const roomCodeFromUrl = searchParams.get("room") ?? "";

  const hasEmittedJoin = useRef(false);

  useEffect(() => {
    if (!joined || !localStream || !joinInfo || hasEmittedJoin.current) return;
    hasEmittedJoin.current = true;
    socket.emit("join-room", joinInfo);
  }, [joined, localStream, joinInfo, socket]);

  useWebRTC(socket, joined ? joinInfo?.roomCode ?? null : null);

  const ttsEnabled = useCallStore((s) => s.ttsEnabled);
  const peers = useCallStore((s) => s.peers);
  const setCaption = useCaptionStore((s) => s.setCaption);
  const micEnabled = useCallStore((s) => s.micEnabled);

  const roomCode = joinInfo?.roomCode ?? null;
  const myLang = joinInfo?.preferredLang ?? "en";
  const speechActive = joined && !!localStream && micEnabled;

  const emitOwnCaption = (text: string) => {
    socket.emit("caption-update", { roomCode, text, lang: myLang, isFinal: true });
  };

  useSpeechRecognition({
    active: speechActive && isSpeechRecognitionSupported,
    lang: BCP47[myLang] ?? "en-US",
    onFinalResult: emitOwnCaption,
  });

  useWhisperFallback({
    active: speechActive && !isSpeechRecognitionSupported,
    stream: localStream,
    lang: myLang,
    onResult: emitOwnCaption,
  });

  useEffect(() => {
    const onCaptionUpdate = async (payload: CaptionUpdate) => {
      if (!payload.isFinal) return;
      const translated = await translateText(payload.text, myLang);
      const speakerLabel = peers.get(payload.fromSocketId)?.displayName ?? "Guest";

      setCaption(payload.fromSocketId, {
        speakerLabel,
        originalText: payload.text,
        translatedText: translated,
        updatedAt: Date.now(),
      });

      if (ttsEnabled) {
        const utterance = new SpeechSynthesisUtterance(translated);
        utterance.lang = BCP47[myLang] ?? "en-US";
        speechSynthesis.speak(utterance);
      }
    };

    socket.on("caption-update", onCaptionUpdate);
    return () => {
      socket.off("caption-update", onCaptionUpdate);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myLang, ttsEnabled, peers]);

  const [chatOpen, setChatOpen] = useState(false);
  const addMessage = useChatStore((s) => s.addMessage);

  const handleSendChat = (text: string) => {
    socket.emit("chat-message", { roomCode, text, lang: myLang });
  };

  useEffect(() => {
    const onChatMessage = async (payload: ChatMessage) => {
      const isOwn = payload.fromSocketId === socket.id;
      const translated = isOwn ? payload.text : await translateText(payload.text, myLang);

      addMessage({
        id: nanoid(),
        fromSocketId: payload.fromSocketId,
        senderLabel: isOwn ? "You" : peers.get(payload.fromSocketId)?.displayName ?? "Guest",
        isOwn,
        originalText: payload.text,
        translatedText: translated,
        createdAt: payload.createdAt,
      });
    };

    socket.on("chat-message", onChatMessage);
    return () => {
      socket.off("chat-message", onChatMessage);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myLang, peers]);

  const handleJoin = (data: { roomCode: string; displayName: string; preferredLang: string }) => {
    setJoinInfo(data);
    setJoined(true);
  };


    const handleEnd = () => {
    if (roomCode) socket.emit("leave-room", { roomCode });
    reset();
    hasEmittedJoin.current = false;
    setJoined(false);
    setJoinInfo(null);
  };

  const handleBack = () => {
    if (joined) handleEnd();
    navigate("/");
  };

  if (!joined) {
    return (
      <JoinRoom
        onJoin={handleJoin}
        defaultDisplayName={authUser?.displayName ?? ""}
        defaultRoomCode={roomCodeFromUrl}
        onBack={handleBack}
      />
    );
  }

  if (mediaError) {
    return (
      <div className="flex h-screen items-center justify-center p-6 text-center">
        <p>
          {mediaError === "permission-denied" &&
            "Camera/microphone access was denied. Please allow access and rejoin."}
          {mediaError === "no-device" && "No camera or microphone was found on this device."}
          {mediaError === "unknown" && "Could not access camera/microphone."}
        </p>
      </div>
    );
  }

  if (!localStream) {
    return <div className="flex h-screen items-center justify-center">Setting up camera…</div>;
  }

  return (
    <div className="relative flex h-screen flex-col">
      <ConnectionStatus />
      <div className="relative flex-1 overflow-hidden">
        <VideoGrid />
        <CaptionOverlay />
        <ChatPanel open={chatOpen} onClose={() => setChatOpen(false)} onSend={handleSendChat} />
      </div>
      <CallControls onEnd={handleEnd} onToggleChat={() => setChatOpen((v) => !v)} />
    </div>
  );
}