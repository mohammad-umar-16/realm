import { useEffect, useRef } from "react";
import { io, type Socket } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

export function useSocket(enabled: boolean) {
  const socketRef = useRef<Socket | null>(null);

  if (!socketRef.current) {
    socketRef.current = io(SOCKET_URL, { autoConnect: false, withCredentials: true });
  }

  useEffect(() => {
    const socket = socketRef.current!;
    if (!enabled) return;

    const onConnect = () => console.log("[socket] connected:", socket.id);
    const onConnectError = (err: Error) => console.error("[socket] connect_error:", err.message);
    const onDisconnect = (reason: string) => console.warn("[socket] disconnected:", reason);

    socket.on("connect", onConnect);
    socket.on("connect_error", onConnectError);
    socket.on("disconnect", onDisconnect);

    socket.connect();

    return () => {
      socket.off("connect", onConnect);
      socket.off("connect_error", onConnectError);
      socket.off("disconnect", onDisconnect);
      socket.disconnect();
    };
  }, [enabled]);

  return socketRef.current;
}