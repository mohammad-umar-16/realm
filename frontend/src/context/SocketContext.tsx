import { createContext, useContext, type ReactNode } from "react";
import type { Socket } from "socket.io-client";
import { useSocket } from "../hooks/useSocket";
import { useAuthStore } from "../store/authStore";

const SocketContext = createContext<Socket | null>(null);

export function SocketProvider({ children }: { children: ReactNode }) {
  const status = useAuthStore((s) => s.status);
  const socket = useSocket(status === "authenticated");

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
}

export function useSocketContext() {
  return useContext(SocketContext);
}