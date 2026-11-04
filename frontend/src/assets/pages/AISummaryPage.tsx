
import { useEffect, useMemo, useState } from "react";
import {
  Sparkles,
  FileText,
  ListChecks,
  Clock3,
  Copy,
  Download,
  Search,
  CheckCircle2,
  Circle,
  Users,
  MessageSquareText,
} from "lucide-react";
import SectionHeading from "../components/SectionHeading";
import "./AISummaryPage.css";

type TranscriptLine = {
  time?: string;
  timestamp?: string;
  speaker?: string;
  text?: string;
};

type Meeting = {
  id: string | number;
  title: string;
  date?: string;
  time?: string;
  duration?: number | string;
  participants?: string[] | number;
  attendees?: string[] | number;
  summary?: string;
  notes?: string;
  transcript?: string | TranscriptLine[];
  status?: string;
};

type Task = {
  id: string | number;
  title: string;
  project?: string;
  dueDate?: string;
  priority?: string;
  completed?: boolean;
  status?: string;
};

const MEETINGS_KEY = "intellmeet_meetings";
const TASKS_KEY = "intellmeet_tasks";

function readStorage<T>(key: string): T[] {
  try {
    const value = localStorage.getItem(key);
    if (!value) return [];

    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function getMeetingParticipants(meeting: Meeting): string[] {
  const participants = meeting.participants ?? meeting.attendees;

  if (Array.isArray(participants)) {
    return participants.map(String);
  }

  return [];
}

function getDuration(meeting: Meeting): number {
  const duration = Number(meeting.duration);
  return Number.isFinite(duration) && duration > 0 ? duration : 0;
}

function getMeetingSummary(meeting: Meeting | undefined): string {
  if (!meeting) return "";

  return (
    meeting.summary?.trim() ||
    meeting.notes?.trim() ||
    ""
  );
}

function getTranscriptLines(
  meeting: Meeting | undefined
): TranscriptLine[] {
  if (!meeting?.transcript) return [];

  if (Array.isArray(meeting.transcript)) {
    return meeting.transcript;
  }

  if (typeof meeting.transcript === "string") {
    return meeting.transcript
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const match = line.match(
          /^\[?(\d{1,2}:\d{2}(?::\d{2})?)\]?\s*([^:]+):\s*(.*)$/
        );

        if (match) {
          return {
            time: match[1],
            speaker: match[2].trim(),
            text: match[3].trim(),
          };
        }

        return { text: line };
      });
  }

  return [];
}

function formatDate(value?: string): string {
  if (!value) return "Date not set";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getTaskCompleted(task: Task): boolean {
  return (
    task.completed === true ||
    task.status?.toLowerCase() === "completed" ||
    task.status?.toLowerCase() === "done"
  );
}

export default function AISummaryPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedMeetingId, setSelectedMeetingId] = useState("");
  const [activeTab, setActiveTab] = useState<
    "summary" | "transcript" | "actions"
  >("summary");
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const loadData = () => {
      const savedMeetings = readStorage<Meeting>(MEETINGS_KEY);
      const savedTasks = readStorage<Task>(TASKS_KEY);

      setMeetings(savedMeetings);
      setTasks(savedTasks);

      setSelectedMeetingId((current) => {
        if (
          current &&
          savedMeetings.some(
            (meeting) => String(meeting.id) === current
          )
        ) {
          return current;
        }

        return savedMeetings[0]
          ? String(savedMeetings[0].id)
          : "";
      });
    };

    loadData();

    window.addEventListener("storage", loadData);
    window.addEventListener("intellmeet_meetings_updated", loadData);
    window.addEventListener("intellmeet_tasks_updated", loadData);

    return () => {
      window.removeEventListener("storage", loadData);
      window.removeEventListener(
        "intellmeet_meetings_updated",
        loadData
      );
      window.removeEventListener("intellmeet_tasks_updated", loadData);
    };
  }, []);

  const selectedMeeting = useMemo(
    () =>
      meetings.find(
        (meeting) => String(meeting.id) === selectedMeetingId
      ),
    [meetings, selectedMeetingId]
  );

  const summary = getMeetingSummary(selectedMeeting);
  const transcript = getTranscriptLines(selectedMeeting);

  const filteredTranscript = transcript.filter((line) => {
    const query = search.toLowerCase();

    return (
      (line.speaker ?? "").toLowerCase().includes(query) ||
      (line.text ?? "").toLowerCase().includes(query) ||
      (line.time ?? line.timestamp ?? "")
        .toLowerCase()
        .includes(query)
    );
  });

  const completedCount = tasks.filter(getTaskCompleted).length;
  const pendingCount = tasks.length - completedCount;
  const completionPercent =
    tasks.length > 0
      ? Math.round((completedCount / tasks.length) * 100)
      : 0;

  const participants = selectedMeeting
    ? getMeetingParticipants(selectedMeeting)
    : [];

  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2500);
  };

  const copyText = async (text: string) => {
    if (!text.trim()) {
      showNotice("No content available to copy.");
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      showNotice("Copied to clipboard.");
    } catch {
      showNotice("Copy failed. Please try again.");
    }
  };

  const toggleTask = (taskId: string | number) => {
    const updatedTasks = tasks.map((task) => {
      if (String(task.id) !== String(taskId)) return task;

      const completed = !getTaskCompleted(task);

      return {
        ...task,
        completed,
        status: completed ? "Done" : "To Do",
      };
    });

    setTasks(updatedTasks);

    try {
      localStorage.setItem(TASKS_KEY, JSON.stringify(updatedTasks));
      window.dispatchEvent(new Event("intellmeet_tasks_updated"));
      showNotice("Task status saved.");
    } catch {
      showNotice("Unable to save task status.");
    }
  };

  const downloadSummary = () => {
    if (!selectedMeeting) {
      showNotice("Create a meeting first.");
      return;
    }

    const actionItems = tasks
      .map(
        (task) =>
          `- [${getTaskCompleted(task) ? "x" : " "}] ${task.title}${
            task.project ? ` | Project: ${task.project}` : ""
          }${task.dueDate ? ` | Due: ${task.dueDate}` : ""}`
      )
      .join("\n");

    const transcriptText = transcript
      .map(
        (line) =>
          `${line.time ?? line.timestamp ?? ""} ${
            line.speaker ? `${line.speaker}: ` : ""
          }${line.text ?? ""}`.trim()
      )
      .join("\n");

    const content = [
      `Meeting: ${selectedMeeting.title}`,
      `Date: ${formatDate(selectedMeeting.date)}`,
      `Time: ${selectedMeeting.time ?? "Not set"}`,
      `Duration: ${getDuration(selectedMeeting)} minutes`,
      `Participants: ${
        participants.length ? participants.join(", ") : "Not recorded"
      }`,
      "",
      "SUMMARY",
      summary || "No summary has been saved for this meeting.",
      "",
      "TRANSCRIPT",
      transcriptText || "No transcript has been saved for this meeting.",
      "",
      "WORKSPACE TASKS",
      actionItems || "No tasks have been created.",
    ].join("\n");

    const blob = new Blob([content], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `${selectedMeeting.title
      .replace(/[^a-z0-9-_ ]/gi, "")
      .trim()
      .replace(/\s+/g, "-") || "meeting"}-report.txt`;

    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    showNotice("Report downloaded.");
  };

  return (
    <div className="ai-summary-page">
      <SectionHeading
        title="Meeting Summary"
        subtitle="Review your saved meeting details, transcript, and workspace tasks."
      />

      <div className="ais-top-actions">
        <button
          className="ais-btn ais-btn-primary"
          onClick={downloadSummary}
          disabled={!selectedMeeting}
        >
          <Download size={16} />
          Export Report
        </button>
      </div>

      {notice && <div className="ais-notice">{notice}</div>}

      <section className="ais-meeting-banner">
        <div className="ais-banner-icon">
          <Sparkles size={24} />
        </div>

        <div className="ais-banner-content">
          <span className="ais-eyebrow">SELECTED MEETING</span>

          {meetings.length > 0 ? (
            <select
              className="ais-meeting-select"
              value={selectedMeetingId}
              onChange={(event) =>
                setSelectedMeetingId(event.target.value)
              }
              aria-label="Select a meeting"
            >
              {meetings.map((meeting) => (
                <option key={meeting.id} value={String(meeting.id)}>
                  {meeting.title}
                  {meeting.date ? ` — ${formatDate(meeting.date)}` : ""}
                </option>
              ))}
            </select>
          ) : (
            <h2>No meetings available</h2>
          )}

          {selectedMeeting && (
            <div className="ais-banner-meta">
              <span>
                <Clock3 size={14} />
                {getDuration(selectedMeeting)} minutes
              </span>
              <span>
                <Users size={14} />
                {participants.length} participants recorded
              </span>
              <span>
                <FileText size={14} />
                {formatDate(selectedMeeting.date)}
              </span>
            </div>
          )}
        </div>
      </section>

      <div className="ais-stats-grid">
        <div className="ais-stat-card">
          <div className="ais-stat-icon">
            <FileText size={19} />
          </div>
          <div>
            <span className="ais-stat-label">Meeting Summary</span>
            <strong>{summary ? "Available" : "Not available"}</strong>
          </div>
        </div>

        <div className="ais-stat-card">
          <div className="ais-stat-icon">
            <MessageSquareText size={19} />
          </div>
          <div>
            <span className="ais-stat-label">Transcript Lines</span>
            <strong>{transcript.length}</strong>
          </div>
        </div>

        <div className="ais-stat-card">
          <div className="ais-stat-icon">
            <ListChecks size={19} />
          </div>
          <div>
            <span className="ais-stat-label">Workspace Tasks</span>
            <strong>{tasks.length}</strong>
          </div>
        </div>

        <div className="ais-stat-card">
          <div className="ais-stat-icon">
            <CheckCircle2 size={19} />
          </div>
          <div>
            <span className="ais-stat-label">Tasks Completed</span>
            <strong>
              {completedCount}/{tasks.length}
            </strong>
          </div>
        </div>
      </div>

      <div className="ais-tabs">
        <button
          className={activeTab === "summary" ? "active" : ""}
          onClick={() => setActiveTab("summary")}
        >
          <FileText size={16} />
          Summary
        </button>

        <button
          className={activeTab === "transcript" ? "active" : ""}
          onClick={() => setActiveTab("transcript")}
        >
          <MessageSquareText size={16} />
          Transcript
        </button>

        <button
          className={activeTab === "actions" ? "active" : ""}
          onClick={() => setActiveTab("actions")}
        >
          <ListChecks size={16} />
          Action Items
        </button>
      </div>

      {activeTab === "summary" && (
        <section className="ais-content-card">
          <div className="ais-card-header">
            <div>
              <h3>Meeting Summary</h3>
              <p>Summary saved with the selected meeting.</p>
            </div>

            <button
              className="ais-icon-btn"
              onClick={() => copyText(summary)}
              title="Copy summary"
              aria-label="Copy summary"
            >
              <Copy size={16} />
            </button>
          </div>

          {summary ? (
            <div className="ais-summary-text">{summary}</div>
          ) : (
            <div className="ais-empty-state">
              <Sparkles size={28} />
              <h3>No summary available</h3>
              <p>
                This meeting does not have a saved summary or notes yet.
                Connect an AI summarization service or add a summary to
                the meeting data to display it here.
              </p>
            </div>
          )}

          <div className="ais-card-footer">
            <span>
              {summary
                ? "Showing saved meeting content"
                : "Waiting for actual summary data"}
            </span>
          </div>
        </section>
      )}

      {activeTab === "transcript" && (
        <section className="ais-content-card">
          <div className="ais-card-header">
            <div>
              <h3>Meeting Transcript</h3>
              <p>Only transcript content saved with this meeting is shown.</p>
            </div>
          </div>

          <div className="ais-search">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search transcript..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          {filteredTranscript.length > 0 ? (
            <div className="ais-transcript-list">
              {filteredTranscript.map((line, index) => (
                <div className="ais-transcript-line" key={index}>
                  <div className="ais-transcript-time">
                    {line.time ?? line.timestamp ?? "--:--"}
                  </div>
                  <div className="ais-transcript-body">
                    {line.speaker && (
                      <strong>{line.speaker}</strong>
                    )}
                    <p>{line.text ?? ""}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="ais-empty-state">
              <MessageSquareText size={28} />
              <h3>
                {transcript.length
                  ? "No matching transcript lines"
                  : "No transcript available"}
              </h3>
              <p>
                {transcript.length
                  ? "Try another search term."
                  : "A transcript has not been saved for this meeting. Recording, transcription, or an API integration is needed to populate this section."}
              </p>
            </div>
          )}
        </section>
      )}

      {activeTab === "actions" && (
        <section className="ais-content-card">
          <div className="ais-card-header">
            <div>
              <h3>Workspace Tasks</h3>
              <p>
                These tasks come from your saved workspace task list.
                They are not automatically linked to a specific meeting.
              </p>
            </div>

            <span className="ais-count-badge">
              {completedCount}/{tasks.length} completed
            </span>
          </div>

          <div className="ais-progress-track">
            <div
              className="ais-progress-fill"
              style={{ width: `${completionPercent}%` }}
            />
          </div>

          {tasks.length > 0 ? (
            <div className="ais-action-list">
              {tasks.map((task) => {
                const completed = getTaskCompleted(task);

                return (
                  <div
                    className={`ais-action-item ${
                      completed ? "completed" : ""
                    }`}
                    key={task.id}
                  >
                    <button
                      className="ais-task-toggle"
                      onClick={() => toggleTask(task.id)}
                      aria-label={
                        completed
                          ? `Mark ${task.title} incomplete`
                          : `Mark ${task.title} complete`
                      }
                    >
                      {completed ? (
                        <CheckCircle2 size={20} />
                      ) : (
                        <Circle size={20} />
                      )}
                    </button>

                    <div className="ais-action-content">
                      <strong>{task.title}</strong>
                      <div className="ais-action-meta">
                        {task.project && <span>{task.project}</span>}
                        {task.dueDate && (
                          <span>Due: {formatDate(task.dueDate)}</span>
                        )}
                        {task.priority && (
                          <span>Priority: {task.priority}</span>
                        )}
                      </div>
                    </div>

                    <span className="ais-action-status">
                      {completed ? "Completed" : "Pending"}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="ais-empty-state">
              <ListChecks size={28} />
              <h3>No workspace tasks yet</h3>
              <p>
                Create tasks in the Tasks or Workspace page. They will
                appear here automatically when saved.
              </p>
            </div>
          )}

          <div className="ais-card-footer">
            <span>{pendingCount} task(s) pending</span>
            <span>{completionPercent}% completed</span>
          </div>
        </section>
      )}

      <p className="ais-disclaimer">
        Meeting summaries and transcripts are displayed only when real
        data exists in local storage. This page does not generate AI
        summaries or transcripts by itself. Data saved in this browser
        is not automatically shared with other users or devices.
      </p>
    </div>
  );
}
