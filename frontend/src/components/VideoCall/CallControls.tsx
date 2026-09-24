import { Mic, MicOff, Video, VideoOff, Volume2, VolumeX, MessageSquare, PhoneOff } from "lucide-react";
import { useCallStore } from "../../store/callStore";

function ControlButton({
  onClick,
  active,
  danger,
  icon: Icon,
  label,
}: {
  onClick: () => void;
  active?: boolean;
  danger?: boolean;
  icon: typeof Mic;
  label: string;
}) {
  const bg = danger ? "bg-red-800 hover:bg-red-700" : active ? "bg-primary hover:bg-primary-hover" : "bg-surface-2 hover:bg-border";
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`flex h-11 w-11 items-center justify-center rounded-full text-ink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-light ${bg}`}
    >
      <Icon className="h-5 w-5" strokeWidth={1.75} />
    </button>
  );
}

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
      <ControlButton onClick={handleToggleMic} active={!micEnabled} icon={micEnabled ? Mic : MicOff} label={micEnabled ? "Mute" : "Unmute"} />
      <ControlButton onClick={handleToggleCam} active={!camEnabled} icon={camEnabled ? Video : VideoOff} label={camEnabled ? "Turn camera off" : "Turn camera on"} />
      <ControlButton onClick={toggleTts} active={ttsEnabled} icon={ttsEnabled ? Volume2 : VolumeX} label="Voice translation" />
      <ControlButton onClick={onToggleChat} icon={MessageSquare} label="Chat" />
      <ControlButton onClick={onEnd} danger icon={PhoneOff} label="End call" />
    </div>
  );
}