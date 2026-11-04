import { useEffect, useMemo, useState } from "react";
import {
  Video,
  Users,
  CalendarDays,
  Clock3,
  ChevronRight,
  Download,
  History,
  X,
} from "lucide-react";
import jsPDF from "jspdf";
import "./MeetingHistoryPage.css";

type MeetingStatus = "Completed" | "Upcoming" | "Cancelled";

type MeetingRecord = {
  id: string;
  title: string;
  host: string;
  date: string;
  time: string;
  duration: number;
  participants: number;
  status: MeetingStatus;
  summary?: string;
};

const STORAGE_KEYS = [
  "intellmeet_meetings",
  "intellmeet_saved_meetings",
  "savedMeetings",
  "meetings",
];

function readMeetings(): MeetingRecord[] {
  try {
    let saved: unknown[] = [];

    for (const key of STORAGE_KEYS) {
      const raw = localStorage.getItem(key);

      if (!raw) continue;

      const parsed = JSON.parse(raw);
      const records = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed?.meetings)
          ? parsed.meetings
          : Array.isArray(parsed?.data)
            ? parsed.data
            : [];

      if (records.length > 0) {
        saved = records;
        break;
      }
    }

    return saved.map((item: any, index) => {
      const rawStatus = String(
        item.status || item.meetingStatus || ""
      ).toLowerCase();

      const status: MeetingStatus =
        rawStatus.includes("cancel")
          ? "Cancelled"
          : rawStatus.includes("complete") ||
              rawStatus.includes("ended") ||
              rawStatus.includes("finished")
            ? "Completed"
            : "Upcoming";

      const dateValue =
        item.date || item.meetingDate || item.startTime || item.createdAt;

      const date = dateValue ? new Date(dateValue) : new Date();

      return {
        id: String(item.id || item._id || index + 1),
        title: String(
          item.title || item.name || item.meetingName || "Untitled meeting"
        ),
        host: String(
          item.hostName || item.host || item.organizer || "Not specified"
        ),
        date: Number.isNaN(date.getTime())
          ? new Date().toISOString()
          : date.toISOString(),
        time: String(item.time || ""),
        duration: Math.max(
          0,
          Number(item.durationMinutes ?? item.duration ?? 15) || 0
        ),
        participants: Math.max(
          0,
          Number(
            item.participantCount ??
              item.participantsCount ??
              (Array.isArray(item.participants)
                ? item.participants.length
                : item.participants) ??
              1
          ) || 0
        ),
        status,
        summary: item.summary || item.description || "",
      };
    });
  } catch (error) {
    console.error("Could not load meeting history:", error);
    return [];
  }
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(meeting: MeetingRecord) {
  if (meeting.time) return meeting.time;

  const date = new Date(meeting.date);

  if (Number.isNaN(date.getTime())) return "--:--";

  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function downloadMeeting(meeting: MeetingRecord) {
  const pdf = new jsPDF();

  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = 25;

  // Header
  pdf.setFillColor(79, 70, 229);
  pdf.rect(0, 0, pageWidth, 42, "F");

  pdf.setTextColor(255, 255, 255);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(19);
  pdf.text("IntellMeet", margin, 18);

  pdf.setFontSize(11);
  pdf.setFont("helvetica", "normal");
  pdf.text("Meeting History Report", margin, 29);

  // Meeting title
  y = 57;
  pdf.setTextColor(35, 42, 58);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);

  const titleLines = pdf.splitTextToSize(
    meeting.title,
    contentWidth
  );

  pdf.text(titleLines, margin, y);
  y += titleLines.length * 8 + 8;

  // Details
  const details: [string, string][] = [
    ["Host", meeting.host || "Not specified"],
    ["Date", formatDate(meeting.date)],
    ["Time", formatTime(meeting)],
    ["Duration", `${meeting.duration} minutes`],
    ["Participants", String(meeting.participants)],
    ["Status", meeting.status],
    ["Summary", meeting.summary || "No summary available."],
  ];

  details.forEach(([label, value]) => {
    const valueLines = pdf.splitTextToSize(
      String(value),
      contentWidth - 45
    );

    const rowHeight = Math.max(13, valueLines.length * 6 + 7);

    // Keep each row on the next page if necessary
    if (y + rowHeight > 270) {
      pdf.addPage();
      y = 22;
    }

    pdf.setDrawColor(225, 229, 239);
    pdf.setFillColor(248, 249, 253);
    pdf.roundedRect(
      margin,
      y - 5,
      contentWidth,
      rowHeight,
      2,
      2,
      "FD"
    );

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.setTextColor(90, 99, 120);
    pdf.text(label, margin + 4, y + 3);

    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(35, 42, 58);
    pdf.text(valueLines, margin + 45, y + 3);

    y += rowHeight + 3;
  });

  // Footer
  const pageCount = pdf.getNumberOfPages();

  for (let page = 1; page <= pageCount; page++) {
    pdf.setPage(page);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(130, 138, 153);

    pdf.text(
      `IntellMeet | Meeting Report | Page ${page} of ${pageCount}`,
      margin,
      287
    );
  }

  // Download PDF
  const safeName = meeting.title
    .replace(/[^a-z0-9-_]/gi, "_")
    .slice(0, 60);

  pdf.save(`${safeName || "meeting"}_report.pdf`);
}

export default function MeetingHistoryPage() {
  const [meetings, setMeetings] = useState<MeetingRecord[]>([]);
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedMeeting, setSelectedMeeting] =
    useState<MeetingRecord | null>(null);

  useEffect(() => {
    const refresh = () => setMeetings(readMeetings());

    refresh();

    window.addEventListener("storage", refresh);
    window.addEventListener("intellmeet_meetings_updated", refresh);

    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("intellmeet_meetings_updated", refresh);
    };
  }, []);

  const filteredMeetings = useMemo(() => {
    const now = new Date();

    return meetings.filter((meeting) => {
      const query = search.trim().toLowerCase();

      const matchesSearch =
        !query ||
        meeting.title.toLowerCase().includes(query) ||
        meeting.host.toLowerCase().includes(query);

      const meetingDate = new Date(meeting.date);

      let matchesDate = true;

      if (dateFilter === "today") {
        matchesDate = meetingDate.toDateString() === now.toDateString();
      } else if (dateFilter === "week") {
        const weekAgo = new Date(now);
        weekAgo.setDate(now.getDate() - 7);
        matchesDate = meetingDate >= weekAgo && meetingDate <= now;
      } else if (dateFilter === "month") {
        matchesDate =
          meetingDate.getMonth() === now.getMonth() &&
          meetingDate.getFullYear() === now.getFullYear();
      }

      const matchesStatus =
        statusFilter === "all" ||
        meeting.status.toLowerCase() === statusFilter;

      return matchesSearch && matchesDate && matchesStatus;
    });
  }, [meetings, search, dateFilter, statusFilter]);

  const completedCount = meetings.filter(
    (meeting) => meeting.status === "Completed"
  ).length;

  const participantCount = meetings
    .filter((meeting) => meeting.status === "Completed")
    .reduce((total, meeting) => total + meeting.participants, 0);

  return (
    <section className="meeting-history-page">
      <div className="meeting-history-heading">
        <span className="meeting-history-eyebrow">MEETING ARCHIVE</span>
        <h1>Meeting History</h1>
        <p>Review saved meetings, participants, durations, and available summaries.</p>
      </div>

      <div className="meeting-history-stats">
        <article className="meeting-history-stat-card">
        
          <div className="meeting-history-stat-copy">
            <span>Total meetings</span>
            <strong>{meetings.length}</strong>
            <small>Saved meetings</small>
          </div>
        </article>

        <article className="meeting-history-stat-card">
         
          <div className="meeting-history-stat-copy">
            <span>Completed</span>
            <strong>{completedCount}</strong>
            <small>Completed meetings</small>
          </div>
        </article>

        <article className="meeting-history-stat-card">
     
          <div className="meeting-history-stat-copy">
            <span>Participant seats</span>
            <strong>{participantCount}</strong>
            <small>Across completed meetings</small>
          </div>
        </article>
      </div>

      <section className="meeting-history-panel">
        <div className="meeting-history-panel-header">
          <div>
            <h2>Previous meetings</h2>
            <p>Find and review your saved sessions.</p>
          </div>
          <span className="meeting-history-result-count">
            {filteredMeetings.length} results
          </span>
        </div>

        <div className="meeting-history-toolbar">
          <label >
            <input
            className="meeting-history-search"
              type="search"
              placeholder="Search meeting or host..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            {search && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setSearch("")}
              >
                <X size={15} />
              </button>
            )}
          </label>

          <label className="meeting-history-filter">
            <CalendarDays size={16} />
            <select
              aria-label="Filter by date"
              value={dateFilter}
              onChange={(event) => setDateFilter(event.target.value)}
            >
              <option value="all">All time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 days</option>
              <option value="month">This month</option>
            </select>
          </label>

          <label className="meeting-history-filter">
            <select
              aria-label="Filter by status"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="all">All statuses</option>
              <option value="completed">Completed</option>
              <option value="upcoming">Upcoming</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </label>
        </div>

        {filteredMeetings.length > 0 ? (
          <div className="meeting-history-table-wrap">
            <table className="meeting-history-table">
              <thead>
                <tr>
                  <th>Meeting</th>
                  <th>Date &amp; Time</th>
                  <th>Duration</th>
                  <th>Participants</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMeetings.map((meeting) => (
                  <tr key={meeting.id}>
                    <td>
                      <div className="meeting-history-name">
                        <div className="meeting-history-name-icon">
                          <Video size={19} />
                        </div>
                        <div>
                          <strong>{meeting.title}</strong>
                          <span>Hosted by {meeting.host}</span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div className="meeting-history-date">
                        <strong>{formatDate(meeting.date)}</strong>
                        <span>{formatTime(meeting)}</span>
                      </div>
                    </td>

                    <td>
                      <span className="meeting-history-duration">
                        <Clock3 size={14} />
                        {meeting.duration} min
                      </span>
                    </td>

                    <td>
                      <span className="meeting-history-participants">
                        <Users size={15} />
                        {meeting.participants}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`meeting-history-status ${meeting.status.toLowerCase()}`}
                      >
                        <Clock3 size={12} />
                        {meeting.status}
                      </span>
                    </td>

                    <td>
                      <div className="meeting-history-actions">
                        <button
                          type="button"
                          className="meeting-history-action"
                          title="View meeting details"
                          aria-label={`View ${meeting.title}`}
                          onClick={() => setSelectedMeeting(meeting)}
                        >
                          <ChevronRight size={18} />
                        </button>

                        <button
                          type="button"
                          className="meeting-history-action"
                          title="Download meeting details"
                          aria-label={`Download ${meeting.title}`}
                          onClick={() => downloadMeeting(meeting)}
                        >
                          <Download size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="meeting-history-empty">
            <History size={30} />
            <h3>No meetings found</h3>
            <p>
              {meetings.length === 0
                ? "Your saved meetings will appear here."
                : "Try changing your search or filters."}
            </p>
            {(search || dateFilter !== "all" || statusFilter !== "all") && (
              <button
                type="button"
                className="meeting-history-action"
                onClick={() => {
                  setSearch("");
                  setDateFilter("all");
                  setStatusFilter("all");
                }}
              >
                Reset filters
              </button>
            )}
          </div>
        )}

        <footer className="meeting-history-footer">
          <span>
            Showing {filteredMeetings.length} of {meetings.length} meetings
          </span>
          <span>Meeting data from local storage</span>
        </footer>
      </section>

      {selectedMeeting && (
        <div
          className="meeting-history-modal-backdrop"
          onClick={() => setSelectedMeeting(null)}
        >
          <section
            className="meeting-history-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="meeting-detail-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="meeting-history-modal-header">
              <div>
                <span className="meeting-history-eyebrow">MEETING DETAILS</span>
                <h2 id="meeting-detail-title">{selectedMeeting.title}</h2>
              </div>
              <button
                type="button"
                className="meeting-history-action"
                aria-label="Close details"
                onClick={() => setSelectedMeeting(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="meeting-history-modal-body">
              <p><strong>Host:</strong> {selectedMeeting.host}</p>
              <p><strong>Date:</strong> {formatDate(selectedMeeting.date)}</p>
              <p><strong>Time:</strong> {formatTime(selectedMeeting)}</p>
              <p><strong>Duration:</strong> {selectedMeeting.duration} minutes</p>
              <p><strong>Participants:</strong> {selectedMeeting.participants}</p>
              <p><strong>Status:</strong> {selectedMeeting.status}</p>
              <p><strong>Summary:</strong> {selectedMeeting.summary || "No summary available."}</p>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
