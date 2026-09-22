export interface PeerInfo {
  socketId: string;
  participantId: string;
  displayName: string;
  preferredLang: string;
}

export type SignalData =
  | { type: "offer"; sdp: RTCSessionDescriptionInit }
  | { type: "answer"; sdp: RTCSessionDescriptionInit }
  | { type: "ice-candidate"; candidate: RTCIceCandidateInit };

export interface ChatMessage {
  fromSocketId: string;
  text: string;
  lang: string;
  translatedText?: string;
  translatedLang?: string;
  createdAt: string;
}

export interface CaptionUpdate {
  fromSocketId: string;
  text: string;
  lang: string;
  isFinal: boolean;
  translatedText?: string;
  translatedLang?: string;
}

export type ConnectionStatus = "idle" | "connecting" | "connected" | "reconnecting" | "failed" | "ended";
