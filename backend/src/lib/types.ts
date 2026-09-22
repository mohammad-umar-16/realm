export interface JoinRoomPayload {
  roomCode: string;
  displayName: string;
  preferredLang: string;
}

export interface SignalPayload {
  roomCode: string;
  targetSocketId: string;
  data: unknown;
}

export interface ChatMessagePayload {
  roomCode: string;
  text: string;
  lang: string;
}

export interface CaptionPayload {
  roomCode: string;
  text: string;
  lang: string;
  isFinal: boolean;
}

export interface PeerInfo {
  socketId: string;
  participantId: string;
  displayName: string;
  preferredLang: string;
}