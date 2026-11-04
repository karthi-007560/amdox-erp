
import "./MeetingHeader.css";

interface Props {
  title: string;
  meetingId: string;
  onLeave: () => void;
}

export default function MeetingHeader({
  title,
  onLeave,
}: Props) {
  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    alert("Meeting link copied!");
  };

  return (
    <header className="mr-header">
      <div>
        <h2>IntelliMeet</h2>
        <span>{title || "Live Meeting"}</span>
      </div>

      <div className="mr-header-actions">
        <button onClick={copyLink}>Copy invite link</button>
        <button className="mr-leave" onClick={onLeave}>
          Leave
        </button>
      </div>
    </header>
  );
}
