
import "./MeetingControls.css";

interface Props {
  muted: boolean;
  cameraOff: boolean;
  onMic: () => void;
  onCamera: () => void;
  onScreen: () => void;
  onChat: () => void;
  onParticipants: () => void;
  onLeave: () => void;
}

export default function MeetingControls({
  muted,
  cameraOff,
  onMic,
  onCamera,
  onScreen,
  onChat,
  onParticipants,
  onLeave,
}: Props) {
  return (
    <div className="mr-controls">
      <button onClick={onMic}>
        {muted ? "Unmute" : "Mute"}
      </button>

      <button onClick={onCamera}>
        {cameraOff ? "Camera On" : "Camera Off"}
      </button>

      <button onClick={onScreen}>Share Screen</button>
      <button onClick={onParticipants}>Participants</button>
      <button onClick={onChat}>Chat</button>

      <button className="mr-end-call" onClick={onLeave}>
        End Call
      </button>
    </div>
  );
}
