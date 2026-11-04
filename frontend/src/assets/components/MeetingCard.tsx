import "./MeetingCard.css";

export type Meeting = {
  id: string;
  title: string;
  date: string;
  time: string;
  duration: string;
  participants: string[];
  category: string;
  color?: "purple" | "blue" | "green" | "orange";
  status?: "Upcoming" | "In Progress" | "Completed";
};

type MeetingCardProps = {
  meeting: Meeting;
  onJoin?: (meeting: Meeting) => void;
};

export default function MeetingCard({ meeting, onJoin }: MeetingCardProps) {
  const status = meeting.status ?? "Upcoming";

  return (
    <article className="meeting-card">
      <div className="meeting-card-header">
        <div className={`meeting-category-icon ${meeting.color ?? "purple"}`}>
          ◉
        </div>
        <span className={`meeting-status ${status.toLowerCase().replace(" ", "-")}`}>
          {status}
        </span>
      </div>

      <div className="meeting-card-body">
        <span className="meeting-category">{meeting.category}</span>
        <h3>{meeting.title}</h3>
        <div className="meeting-detail">▦ {meeting.date}</div>
        <div className="meeting-detail">◷ {meeting.time} · {meeting.duration}</div>
      </div>

      <div className="meeting-card-footer">
        <div className="participant-stack">
          {(meeting.participants ?? []).slice(0, 4).map((person, index) => (
            <span
              className={`participant-avatar participant-${index % 4}`}
              key={`${person}-${index}`}
              title={person}
            >
              {person.charAt(0).toUpperCase()}
            </span>
          ))}
        </div>

        <button
          className="meeting-join-button"
          disabled={status === "Completed"}
          onClick={() => onJoin?.(meeting)}
        >
          {status === "Completed" ? "Ended" : "Join meeting"} →
        </button>
      </div>
    </article>
  );
}