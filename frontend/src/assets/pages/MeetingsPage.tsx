import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays,
  Clock3,
  Plus,
  Video,
  X,
  Trash2,
} from "lucide-react";
import type { Meeting } from "../components/MeetingCard";
import SectionHeading from "../components/SectionHeading";
import "./MeetingsPage.css";

type FilterType = "All" | "Upcoming" | "In Progress" | "Completed";

const STORAGE_KEY = "intellmeet_meetings";

function loadMeetings(): Meeting[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return [];

    const parsed: unknown = JSON.parse(saved);
    return Array.isArray(parsed) ? (parsed as Meeting[]) : [];
  } catch {
    return [];
  }
}

function saveMeetings(meetings: Meeting[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(meetings));
  window.dispatchEvent(new Event("intellmeet_meetings_updated"));
}

export default function MeetingsPage() {
  const navigate = useNavigate();

  const [meetings, setMeetings] = useState<Meeting[]>(loadMeetings);
  const [filter, setFilter] = useState<FilterType>("All");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState("30 min");
  const [category, setCategory] = useState("Team Meeting");
  const [participantsText, setParticipantsText] = useState("");

  useEffect(() => {
    const refresh = () => setMeetings(loadMeetings());

    window.addEventListener("storage", refresh);
    window.addEventListener("intellmeet_meetings_updated", refresh);

    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("intellmeet_meetings_updated", refresh);
    };
  }, []);

  const filteredMeetings = useMemo(() => {
    const query = search.trim().toLowerCase();

    return meetings.filter((meeting) => {
      const matchesFilter =
        filter === "All" || (meeting.status ?? "Upcoming") === filter;

      const matchesSearch = [
        meeting.title,
        meeting.category,
        meeting.date,
        meeting.time,
        meeting.duration,
        ...(meeting.participants ?? []),
      ].some((value) =>
        String(value ?? "").toLowerCase().includes(query)
      );

      return matchesFilter && matchesSearch;
    });
  }, [meetings, filter, search]);

  function scheduleMeeting(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const participants = participantsText
      .split(",")
      .map((person) => person.trim())
      .filter(Boolean);

    const newMeeting: Meeting = {
      id: `meeting-${Date.now()}`,
      title: title.trim(),
      date,
      time,
      duration,
      participants: participants.length ? participants : ["You"],
      category,
      color: "purple",
      status: "Upcoming",
    };

    const updated = [newMeeting, ...meetings];

    saveMeetings(updated);
    setMeetings(updated);

    setTitle("");
    setDate("");
    setTime("");
    setDuration("30 min");
    setCategory("Team Meeting");
    setParticipantsText("");
    setShowForm(false);
  }

  function deleteMeeting(id: string) {
    if (!window.confirm("Delete this meeting?")) return;

    const updated = meetings.filter((meeting) => meeting.id !== id);
    saveMeetings(updated);
    setMeetings(updated);
  }

  function updateStatus(meeting: Meeting) {
    const current = meeting.status ?? "Upcoming";

    const nextStatus: Meeting["status"] =
      current === "Upcoming"
        ? "In Progress"
        : current === "In Progress"
          ? "Completed"
          : "Upcoming";

    const updated = meetings.map((item) =>
      item.id === meeting.id
        ? { ...item, status: nextStatus }
        : item
    );

    saveMeetings(updated);
    setMeetings(updated);
  }

  function joinMeeting(meeting: Meeting) {
    if (meeting.status === "Completed") return;

    navigate(`/meeting/${encodeURIComponent(meeting.id)}`);
  }

  const upcomingCount = meetings.filter(
    (meeting) => (meeting.status ?? "Upcoming") === "Upcoming"
  ).length;

  const inProgressCount = meetings.filter(
    (meeting) => meeting.status === "In Progress"
  ).length;

  const completedCount = meetings.filter(
    (meeting) => meeting.status === "Completed"
  ).length;

  const today = new Date();
  const minDate = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");

  return (
    <section className="meetings-page">
      <SectionHeading
        eyebrow="MEETING CENTER"
        title="Your Meetings"
        subtitle="Create and manage your own meeting schedule."
        action={
          <button
            className="meeting-primary-btn"
            onClick={() => setShowForm(true)}
          >
            <Plus size={18} /> Schedule Meeting
          </button>
        }
      />

      <div className="meeting-summary">
        <div className="meeting-summary-card">
          <span>Total Meetings</span>
          <strong>{meetings.length}</strong>
        </div>
        <div className="meeting-summary-card">
          <span>Upcoming</span>
          <strong>{upcomingCount}</strong>
        </div>
        <div className="meeting-summary-card">
          <span>In Progress</span>
          <strong>{inProgressCount}</strong>
        </div>
        <div className="meeting-summary-card">
          <span>Completed</span>
          <strong>{completedCount}</strong>
        </div>
      </div>

      <div className="meetings-toolbar">
        <input
          className="meeting-search"
          type="search"
          placeholder="Search your meetings..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <div className="meeting-filters">
          {(["All", "Upcoming", "In Progress", "Completed"] as FilterType[]).map(
            (item) => (
              <button
                key={item}
                className={filter === item ? "active" : ""}
                onClick={() => setFilter(item)}
              >
                {item}
              </button>
            )
          )}
        </div>
      </div>

      {showForm && (
        <div className="meeting-modal-backdrop">
          <form className="meeting-form" onSubmit={scheduleMeeting}>
            <div className="meeting-form-heading">
              <div>
                <span>NEW SESSION</span>
                <h2>Schedule a Meeting</h2>
              </div>

              <button
                type="button"
                className="meeting-close-btn"
                onClick={() => setShowForm(false)}
              >
                <X size={20} />
              </button>
            </div>

            <label>Meeting title</label>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Project planning"
              required
            />

            <label>Meeting type</label>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              <option>Team Meeting</option>
              <option>Client Meeting</option>
              <option>One-on-One</option>
              <option>Project Review</option>
            </select>

            <div className="meeting-form-row">
              <div>
                <label>Date</label>
                <input
                  type="date"
                  min={minDate}
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  required
                />
              </div>

              <div>
                <label>Time</label>
                <input
                  type="time"
                  value={time}
                  onChange={(event) => setTime(event.target.value)}
                  required
                />
              </div>
            </div>

            <label>Duration</label>
            <select
              value={duration}
              onChange={(event) => setDuration(event.target.value)}
            >
              <option>15 min</option>
              <option>30 min</option>
              <option>45 min</option>
              <option>60 min</option>
              <option>90 min</option>
              <option>120 min</option>
            </select>

            <label>Participants (comma-separated)</label>
            <input
              value={participantsText}
              onChange={(event) => setParticipantsText(event.target.value)}
              placeholder="Karthik, Arun, Priya"
            />

            <button type="submit" className="meeting-submit-btn">
              <CalendarDays size={18} /> Create Meeting
            </button>
          </form>
        </div>
      )}

      <div className="meetings-list-heading">
        <div>
          <h2>Meeting Schedule</h2>
          <p>{filteredMeetings.length} meeting(s) found</p>
        </div>
      </div>

      {filteredMeetings.length === 0 ? (
        <div className="meetings-empty">
          <h3>No meetings found</h3>
          <p>Schedule your first meeting to see it here.</p>
          <button
            className="meeting-primary-btn"
            onClick={() => setShowForm(true)}
          >
            <Plus size={18} /> Schedule Meeting
          </button>
        </div>
      ) : (
        <div className="meetings-grid">
          {filteredMeetings.map((meeting) => (
            <article className="meeting-detail-card" key={meeting.id}>
              <div className="meeting-detail-top">
                <div className={`meeting-video-icon ${meeting.color ?? "purple"}`}>
                  <Video size={22} />
                </div>

                <span className={`meeting-status ${(meeting.status ?? "Upcoming").toLowerCase().replace(" ", "-")}`}>
                  {meeting.status ?? "Upcoming"}
                </span>
              </div>

              <span className="meeting-category-label">{meeting.category}</span>
              <h3>{meeting.title}</h3>

              <div className="meeting-detail-info">
                <span><CalendarDays size={16} /> {meeting.date}</span>
                <span><Clock3 size={16} /> {meeting.time} · {meeting.duration}</span>
              </div>

              <div className="meeting-detail-footer">
                <div className="meeting-participants">
                  {(meeting.participants ?? []).slice(0, 4).map((person, index) => (
                    <span
                      className={`meeting-avatar avatar-${index % 4}`}
                      key={`${meeting.id}-${person}-${index}`}
                    >
                      {person.charAt(0).toUpperCase()}
                    </span>
                  ))}
                  <small>{(meeting.participants ?? []).length} participant(s)</small>
                </div>

                <div className="meeting-actions">
                  <button className="meeting-join-btn" onClick={() => updateStatus(meeting)}>
                    Update Status
                  </button>

                  <button
                    className="meeting-join-btn"
                    disabled={meeting.status === "Completed"}
                    onClick={() => joinMeeting(meeting)}
                  >
                    {meeting.status === "Completed" ? "Completed" : "Join"}
                  </button>

                  <button
                    className="meeting-join-btn"
                    onClick={() => deleteMeeting(meeting.id)}
                    aria-label="Delete meeting"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}