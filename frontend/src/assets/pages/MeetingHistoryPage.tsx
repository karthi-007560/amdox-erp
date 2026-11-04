
import { useEffect, useMemo, useState } from "react";
import {
  Search,
  CalendarDays,
  Clock3,
  Users,
  Video,
  FileText,
  Download,
  ChevronRight,
  CircleCheck,
  X,
} from "lucide-react";
import SectionHeading from "../components/SectionHeading";
import "./MeetingHistoryPage.css";

type Meeting = {
  id: string | number;
  title: string;
  date?: string;
  time?: string;
  duration?: number | string;
  participants?: string[] | number;
  attendees?: string[] | number;
  host?: string;
  status?: string;
  summary?: string;
  notes?: string;
};

type MeetingRecord = {
  id: string;
  title: string;
  date: string;
  time: string;
  duration: string;
  participants: number;
  host: string;
  status: "Completed" | "Cancelled" | "Upcoming" | "In Progress";
  hasSummary: boolean;
};

const STORAGE_KEY = "intellmeet_meetings";

function readMeetings(): Meeting[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const parsed: unknown = JSON.parse(stored);
    return Array.isArray(parsed) ? (parsed as Meeting[]) : [];
  } catch {
    return [];
  }
}

function formatDate(value: string) {
  if (!value) return "Date not set";

  const date = new Date(
    /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? `${value}T12:00:00`
      : value
  );

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getParticipantCount(meeting: Meeting): number {
  const people = meeting.participants ?? meeting.attendees;

  if (Array.isArray(people)) return people.length;

  if (typeof people === "number") return people;

  return 0;
}

function getStatus(
  status?: string
): MeetingRecord["status"] {
  const normalized = (status ?? "").toLowerCase();

  if (normalized.includes("cancel")) return "Cancelled";
  if (normalized.includes("progress")) return "In Progress";
  if (normalized.includes("upcoming") || normalized === "scheduled") {
    return "Upcoming";
  }

  if (
    normalized.includes("complete") ||
    normalized === "done" ||
    normalized === "ended"
  ) {
    return "Completed";
  }

  return "Upcoming";
}

function toMeetingRecord(meeting: Meeting): MeetingRecord {
  const durationValue = Number(meeting.duration);

  return {
    id: String(meeting.id),
    title: meeting.title || "Untitled meeting",
    date: meeting.date ?? "",
    time: meeting.time ?? "Time not set",
    duration:
      Number.isFinite(durationValue) && durationValue > 0
        ? `${durationValue} min`
        : typeof meeting.duration === "string" && meeting.duration
          ? meeting.duration
          : "—",
    participants: getParticipantCount(meeting),
    host: meeting.host || "Not specified",
    status: getStatus(meeting.status),
    hasSummary: Boolean(meeting.summary?.trim() || meeting.notes?.trim()),
  };
}

function downloadMeetingReport(
  meeting: MeetingRecord,
  rawMeeting?: Meeting
) {
  const report = [
    "INTELLMEET - MEETING REPORT",
    "---------------------------",
    `Meeting: ${meeting.title}`,
    `Date: ${formatDate(meeting.date)}`,
    `Time: ${meeting.time}`,
    `Duration: ${meeting.duration}`,
    `Host: ${meeting.host}`,
    `Participants: ${meeting.participants}`,
    `Status: ${meeting.status}`,
    "",
    "MEETING SUMMARY / NOTES",
    rawMeeting?.summary?.trim() ||
      rawMeeting?.notes?.trim() ||
      "No summary or notes saved for this meeting.",
  ].join("\n");

  const blob = new Blob([report], {
    type: "text/plain;charset=utf-8",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `meeting-${meeting.id}-report.txt`;
  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}

export default function MeetingHistoryPage() {
  const [meetings, setMeetings] = useState<MeetingRecord[]>([]);
  const [rawMeetings, setRawMeetings] = useState<Meeting[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("All time");
  const [selectedMeeting, setSelectedMeeting] =
    useState<MeetingRecord | null>(null);

  useEffect(() => {
    const loadMeetings = () => {
      const saved = readMeetings();

      setRawMeetings(saved);
      setMeetings(saved.map(toMeetingRecord));
    };

    loadMeetings();

    window.addEventListener("storage", loadMeetings);
    window.addEventListener("intellmeet_meetings_updated", loadMeetings);

    return () => {
      window.removeEventListener("storage", loadMeetings);
      window.removeEventListener(
        "intellmeet_meetings_updated",
        loadMeetings
      );
    };
  }, []);

  const filteredMeetings = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const now = new Date();

    return meetings.filter((meeting) => {
      const matchesSearch =
        meeting.title.toLowerCase().includes(normalizedSearch) ||
        meeting.host.toLowerCase().includes(normalizedSearch);

      const matchesStatus =
        statusFilter === "All" || meeting.status === statusFilter;

      const meetingDate = meeting.date
        ? new Date(
            /^\d{4}-\d{2}-\d{2}$/.test(meeting.date)
              ? `${meeting.date}T12:00:00`
              : meeting.date
          )
        : null;

      let matchesDate = dateFilter === "All time";

      if (
        dateFilter !== "All time" &&
        meetingDate &&
        !Number.isNaN(meetingDate.getTime())
      ) {
        const startOfToday = new Date(now);
        startOfToday.setHours(0, 0, 0, 0);

        const startOfMeetingDay = new Date(meetingDate);
        startOfMeetingDay.setHours(0, 0, 0, 0);

        const daysAgo =
          (startOfToday.getTime() - startOfMeetingDay.getTime()) /
          (1000 * 60 * 60 * 24);

        matchesDate =
          dateFilter === "Last 7 days"
            ? daysAgo >= 0 && daysAgo < 7
            : daysAgo >= 0 && daysAgo < 30;
      }

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [meetings, search, statusFilter, dateFilter]);

  const completedCount = meetings.filter(
    (meeting) => meeting.status === "Completed"
  ).length;

  const totalParticipants = meetings.reduce(
    (total, meeting) =>
      meeting.status === "Completed"
        ? total + meeting.participants
        : total,
    0
  );

  const getRawMeeting = (meetingId: string) =>
    rawMeetings.find(
      (meeting) => String(meeting.id) === meetingId
    );

  return (
    <div className="meeting-history-page">
      <SectionHeading
        eyebrow="MEETING ARCHIVE"
        title="Meeting History"
        subtitle="Review saved meetings, participants, durations, and available summaries."
      />

      <div className="history-stats">
        <article className="history-stat-card">
          <div className="history-stat-icon purple">
            <Video size={21} />
          </div>
          <div>
            <p>Total meetings</p>
            <h3>{meetings.length}</h3>
            <span>Saved meetings</span>
          </div>
        </article>

        <article className="history-stat-card">
          <div className="history-stat-icon green">
            <CircleCheck size={21} />
          </div>
          <div>
            <p>Completed</p>
            <h3>{completedCount}</h3>
            <span>Completed meetings</span>
          </div>
        </article>

        <article className="history-stat-card">
          <div className="history-stat-icon blue">
            <Users size={21} />
          </div>
          <div>
            <p>Participant seats</p>
            <h3>{totalParticipants}</h3>
            <span>Across completed meetings</span>
          </div>
        </article>
      </div>

      <section className="history-panel">
        <div className="history-panel-heading">
          <div>
            <h2>Previous meetings</h2>
            <p>Find and review your saved sessions.</p>
          </div>

          <span className="history-result-count">
            {filteredMeetings.length} results
          </span>
        </div>

        <div className="history-filters">
          <div className="history-search">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search meeting or host..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <div className="history-select-wrap">
            <CalendarDays size={16} />
            <select
              value={dateFilter}
              onChange={(event) => setDateFilter(event.target.value)}
              aria-label="Filter by date"
            >
              <option>All time</option>
              <option>Last 7 days</option>
              <option>Last 30 days</option>
            </select>
          </div>

          <select
            className="history-status-select"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            aria-label="Filter by status"
          >
            <option value="All">All statuses</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
            <option value="Upcoming">Upcoming</option>
            <option value="In Progress">In Progress</option>
          </select>
        </div>

        <div className="history-table-wrap">
          <table className="history-table">
            <thead>
              <tr>
                <th>MEETING</th>
                <th>DATE & TIME</th>
                <th>DURATION</th>
                <th>PARTICIPANTS</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>

            <tbody>
              {filteredMeetings.map((meeting) => (
                <tr key={meeting.id}>
                  <td>
                    <div className="history-meeting-cell">
                      <div className="history-meeting-icon">
                        <Video size={18} />
                      </div>
                      <div>
                        <strong>{meeting.title}</strong>
                        <span>Hosted by {meeting.host}</span>
                      </div>
                    </div>
                  </td>

                  <td>
                    <div className="history-date-cell">
                      <strong>{formatDate(meeting.date)}</strong>
                      <span>{meeting.time}</span>
                    </div>
                  </td>

                  <td>
                    <span className="history-duration">
                      <Clock3 size={14} />
                      {meeting.duration}
                    </span>
                  </td>

                  <td>
                    <span className="history-participants">
                      <Users size={15} />
                      {meeting.participants}
                    </span>
                  </td>

                  <td>
                    <span
                      className={`history-status ${
                        meeting.status === "Completed"
                          ? "completed"
                          : meeting.status === "Cancelled"
                            ? "cancelled"
                            : ""
                      }`}
                    >
                      {meeting.status === "Completed" ? (
                        <CircleCheck size={13} />
                      ) : meeting.status === "Cancelled" ? (
                        <X size={13} />
                      ) : (
                        <Clock3 size={13} />
                      )}
                      {meeting.status}
                    </span>
                  </td>

                  <td>
                    <div className="history-actions">
                      <button
                        className="history-action-button"
                        onClick={() => setSelectedMeeting(meeting)}
                        title="View meeting details"
                        aria-label={`View ${meeting.title}`}
                      >
                        <ChevronRight size={18} />
                      </button>

                      <button
                        className="history-action-button"
                        onClick={() =>
                          downloadMeetingReport(
                            meeting,
                            getRawMeeting(meeting.id)
                          )
                        }
                        title="Download meeting report"
                        aria-label={`Download ${meeting.title} report`}
                      >
                        <Download size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredMeetings.length === 0 && (
            <div className="history-empty">
              <Search size={30} />
              <h3>
                {meetings.length === 0
                  ? "No meetings saved yet"
                  : "No meetings found"}
              </h3>
              <p>
                {meetings.length === 0
                  ? "Create a meeting first. Saved meetings will appear here automatically."
                  : "Try changing your search or filters."}
              </p>

              {meetings.length > 0 && (
                <button
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("All");
                    setDateFilter("All time");
                  }}
                >
                  Reset filters
                </button>
              )}
            </div>
          )}
        </div>

        <div className="history-panel-footer">
          <span>
            Showing {filteredMeetings.length} of {meetings.length} meetings
          </span>
          <span>Live local meeting data</span>
        </div>
      </section>

      {selectedMeeting && (
        <div
          className="history-modal-backdrop"
          onClick={() => setSelectedMeeting(null)}
        >
          <section
            className="history-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="history-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="history-modal-header">
              <div className="history-modal-icon">
                <Video size={21} />
              </div>

              <button
                className="history-modal-close"
                onClick={() => setSelectedMeeting(null)}
                aria-label="Close meeting details"
              >
                <X size={20} />
              </button>
            </div>

            <h2 id="history-modal-title">
              {selectedMeeting.title}
            </h2>
            <p className="history-modal-subtitle">
              Saved meeting details and available resources
            </p>

            <div className="history-modal-details">
              <div>
                <CalendarDays size={17} />
                <span>Date</span>
                <strong>{formatDate(selectedMeeting.date)}</strong>
              </div>
              <div>
                <Clock3 size={17} />
                <span>Duration</span>
                <strong>{selectedMeeting.duration}</strong>
              </div>
              <div>
                <Users size={17} />
                <span>Participants</span>
                <strong>{selectedMeeting.participants}</strong>
              </div>
              <div>
                <CircleCheck size={17} />
                <span>Status</span>
                <strong>{selectedMeeting.status}</strong>
              </div>
            </div>

            <div className="history-summary-notice">
              <FileText size={19} />
              <div>
                <strong>Meeting summary / notes</strong>
                <p>
                  {getRawMeeting(selectedMeeting.id)?.summary?.trim() ||
                  getRawMeeting(selectedMeeting.id)?.notes?.trim() ||
                  "No summary or notes have been saved for this meeting."}
                </p>
              </div>
            </div>

            <button
              className="history-modal-download"
              onClick={() =>
                downloadMeetingReport(
                  selectedMeeting,
                  getRawMeeting(selectedMeeting.id)
                )
              }
            >
              <Download size={17} />
              Download meeting report
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
