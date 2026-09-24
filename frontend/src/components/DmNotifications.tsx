import { useEffect, useRef } from "react";
import { useSocketContext } from "../context/SocketContext";
import { useAuthStore } from "../store/authStore";
import { apiFetch } from "../lib/api";

interface LiveDmEvent {
  id: string;
  text: string;
  fromUserId: string;
  toUserId: string;
}

interface Contact {
  id: string;
  displayName: string;
}

export function DmNotifications() {
  const socket = useSocketContext();
  const user = useAuthStore((s) => s.user);
  const namesRef = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    if (!user || typeof Notification === "undefined") return;
    if (Notification.permission === "default") Notification.requestPermission();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    apiFetch<{ contacts: Contact[] }>("/api/contacts")
      .then((res) => {
        namesRef.current = new Map(res.contacts.map((c) => [c.id, c.displayName]));
      })
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    if (!socket || !user) return;

    const onDmMessage = (payload: LiveDmEvent) => {
      const isIncoming = payload.fromUserId !== user.id;
      const tabIsBackgrounded = document.hidden || !document.hasFocus();
      if (!isIncoming || !tabIsBackgrounded) return;
      if (typeof Notification === "undefined" || Notification.permission !== "granted") return;

      const senderName = namesRef.current.get(payload.fromUserId) ?? "New message";
      const notification = new Notification(senderName, { body: payload.text, icon: "/logo-icon.png" });
      notification.onclick = () => window.focus();
    };

    socket.on("dm-message", onDmMessage);
    return () => {
      socket.off("dm-message", onDmMessage);
    };
  }, [socket, user]);

  return null;
}