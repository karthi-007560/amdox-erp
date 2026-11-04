
import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Clock3,
  Plus,
  Search,
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
    const refreshMeetings = () => setMeetings(loadMeetings());

    window.addEventListener("storage", refreshMeetings);

    return () => {
      window.removeEventListener("storage", refreshMeetings);
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
        meeting.status ?? "",
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

    const updatedMeetings = [newMeeting, ...meetings];

    saveMeetings(updatedMeetings);
    setMeetings(updatedMeetings);

    setTitle("");
    setDate("");
    setTime("");
    setDuration("30 min");
    setCategory("Team Meeting");
    setParticipantsText("");
    setShowForm(false);
    setFilter("All");
    setSearch("");
  }

  function deleteMeeting(id: string) {
    if (!window.confirm("Delete this meeting?")) return;

    const updatedMeetings = meetings.filter((meeting) => meeting.id !== id);

    saveMeetings(updatedMeetings);
    setMeetings(updatedMeetings);
  }

  function updateStatus(meeting: Meeting) {
    const currentStatus = meeting.status ?? "Upcoming";

    const nextStatus =
      currentStatus === "Upcoming"
        ? "In Progress"
        : currentStatus === "In Progress"
          ? "Completed"
          : "Upcoming";

    const updatedMeetings = meetings.map((item) =>
      item.id === meeting.id
        ? { ...item, status: nextStatus }
        : item
    );

  }

  function joinMeeting(meeting: Meeting) {
    alert(
      `"${meeting.title}" selected.\nVideo calling needs backend and WebRTC integration.`
    );
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
            <Plus size={18} />
            Schedule Meeting
          </button>
        }
      />

      <div className="meeting-summary">
        <div className="meeting-summary-card">
          <span>Total Meetings</span>
          <strong>{meetings.length}</strong>
          <small>Your saved meetings</small>
        </div>

        <div className="meeting-summary-card">
          <span>Upcoming</span>
          <strong>{upcomingCount}</strong>
          <small>Ready to attend</small>
        </div>

        <div className="meeting-summary-card">
          <span>In Progress</span>
          <strong>{inProgressCount}</strong>
          <small>Currently active</small>
        </div>

        <div className="meeting-summary-card">
          <span>Completed</span>
          <strong>{completedCount}</strong>
          <small>Finished meetings</small>
        </div>
      </div>

      <div className="meetings-toolbar">
        <div className="meetings-search">
          <Search size={18} />
          <input
            type="search"
            placeholder="Search your meetings..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className="meeting-filters">
          {(
            ["All", "Upcoming", "In Progress", "Completed"] as FilterType[]
          ).map((item) => (
            <button
              key={item}
              className={filter === item ? "active" : ""}
              onClick={() => setFilter(item)}
            >
              {item}
            </button>
          ))}
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
                aria-label="Close form"
              >
                <X size={20} />
              </button>
            </div>

            <label htmlFor="meeting-title">Meeting title</label>
            <input
              id="meeting-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. Project planning"
              maxLength={100}
              required
            />

            <label htmlFor="meeting-category">Meeting type</label>
            <select
              id="meeting-category"
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
                <label htmlFor="meeting-date">Date</label>
                <input
                  id="meeting-date"
                  type="date"
                  min={minDate}
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  required
                />
              </div>

              <div>
                <label htmlFor="meeting-time">Time</label>
                <input
                  id="meeting-time"
                  type="time"
                  value={time}
                  onChange={(event) => setTime(event.target.value)}
                  required
                />
              </div>
            </div>

            <label htmlFor="meeting-duration">Duration</label>
            <select
              id="meeting-duration"
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

            <label htmlFor="meeting-participants">
              Participants (comma-separated)
            </label>
            <input
              id="meeting-participants"
              value={participantsText}
              onChange={(event) =>
                setParticipantsText(event.target.value)
              }
              placeholder="e.g. Karthik, Arun, Priya"
            />

            <p className="meeting-demo-note">
              Your meeting will be saved in this browser.
            </p>

            <button type="submit" className="meeting-submit-btn">
              <CalendarDays size={18} />
              Create Meeting
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
          <h3>{search ? "No meetings found" : "No meetings yet"}</h3>
          <p>
            {search
              ? "Try another search."
              : "Schedule your first meeting to see it here."}
          </p>

          <button
            className="meeting-primary-btn"
            onClick={() => setShowForm(true)}
          >
            <Plus size={18} />
            Schedule Meeting
          </button>
        </div>
      ) : (
        <div className="meetings-grid">
          {filteredMeetings.map((meeting) => (
            <article className="meeting-detail-card" key={meeting.id}>
              <div className="meeting-detail-top">
                <div
                  className={`meeting-video-icon ${meeting.color ?? "purple"}`}
                >
                  <Video size={22} />
                </div>

                <span
                  className={`meeting-status ${(
                    meeting.status ?? "Upcoming"
                  )
                    .toLowerCase()
                    .replace(" ", "-")}`}
                >
                  {meeting.status ?? "Upcoming"}
                </span>
              </div>

              <span className="meeting-category-label">
                {meeting.category}
              </span>

              <h3>{meeting.title}</h3>

              <div className="meeting-detail-info">
                <span>
                  <CalendarDays size={16} />
                  {meeting.date}
                </span>

                <span>
                  <Clock3 size={16} />
                  {meeting.time} · {meeting.duration}
                </span>
              </div>

              <div className="meeting-detail-footer">
                <div className="meeting-participants">
                  {(meeting.participants ?? []).slice(0, 4).map(
                    (person, index) => (
                      <span
                        className={`meeting-avatar avatar-${index % 4}`}
                        key={`${meeting.id}-${person}-${index}`}
                        title={person}
                      >
                        {person.charAt(0).toUpperCase()}
                      </span>
                    )
                  )}

                  <small>
                    {(meeting.participants ?? []).length} participant(s)
                  </small>
                </div>

                <div className="meeting-actions">
                  <button
                    className="meeting-join-btn"
                    onClick={() => updateStatus(meeting)}
                    title="Change meeting status"
                  >
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
                    aria-label={`Delete ${meeting.title}`}
                    title="Delete meeting"
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
