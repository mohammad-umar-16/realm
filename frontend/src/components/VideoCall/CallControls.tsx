import { useCallStore } from "../../store/callStore";

export function CallControls({ onEnd, onToggleChat }: { onEnd: () => void; onToggleChat: () => void }) {
  const { micEnabled, camEnabled, ttsEnabled, toggleMic, toggleCam, toggleTts, localStream } = useCallStore();

  const handleToggleMic = () => {
    localStream?.getAudioTracks().forEach((t) => (t.enabled = !micEnabled));
    toggleMic();
  };

  const handleToggleCam = () => {
    localStream?.getVideoTracks().forEach((t) => (t.enabled = !camEnabled));
    toggleCam();
  };

  return (
    <div className="flex items-center justify-center gap-3 bg-surface p-4">
      <button
        onClick={handleToggleMic}
        className={`rounded-full px-4 py-2 text-ink ${micEnabled ? "bg-surface-2" : "bg-red-700"}`}
      >
        {micEnabled ? "Mute" : "Unmute"}
      </button>
      <button
        onClick={handleToggleCam}
        className={`rounded-full px-4 py-2 text-ink ${camEnabled ? "bg-surface-2" : "bg-red-700"}`}
      >
        {camEnabled ? "Camera off" : "Camera on"}
      </button>
      <button
        onClick={toggleTts}
        className={`rounded-full px-4 py-2 text-ink ${ttsEnabled ? "bg-primary" : "bg-surface-2"}`}
      >
        {ttsEnabled ? "Voice translation: on" : "Voice translation: off"}
      </button>
      <button onClick={onToggleChat} className="rounded-full bg-surface-2 px-4 py-2 text-ink">
        Chat
      </button>
      <button onClick={onEnd} className="rounded-full bg-red-800 px-4 py-2 text-ink">
        End call
      </button>
    </div>
  );
}