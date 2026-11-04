
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  CalendarDays,
  Clock3,
  Download,
  TrendingUp,
  Users,
  CheckCircle2,
} from "lucide-react";
import SectionHeading from "../components/SectionHeading";
import "./AnalyticsPage.css";

type Period = "7 days" | "30 days" | "90 days";

type Meeting = {
  id: string | number;
  title?: string;
  date?: string;
  time?: string;
  duration?: number | string;
  participants?: string[] | string;
  attendees?: string[] | string;
  status?: string;
};

type Task = {
  id: string | number;
  title?: string;
  completed?: boolean;
  status?: string;
  dueDate?: string;
};

const MEETINGS_KEY = "intellmeet_meetings";
const TASKS_KEY = "intellmeet_tasks";

function readArray<T,>(key: string): T[] {
  try {
    const saved = localStorage.getItem(key);
    if (!saved) return [];

    const parsed: unknown = JSON.parse(saved);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function parseMeetingDate(meeting: Meeting): Date | null {
  if (!meeting.date) return null;

  const date = new Date(meeting.date);

  if (Number.isNaN(date.getTime())) return null;

  return date;
}

function getDuration(meeting: Meeting): number {
  const value = Number(meeting.duration);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function isTaskCompleted(task: Task): boolean {
  return (
    task.completed === true ||
    ["completed", "complete", "done"].includes(
      String(task.status || "").toLowerCase()
    )
  );
}

function getParticipantList(meeting: Meeting): string[] {
  const participants = meeting.participants ?? meeting.attendees ?? [];

  if (Array.isArray(participants)) {
    return participants
      .map((person) => String(person).trim())
      .filter(Boolean);
  }

  if (typeof participants === "string") {
    return participants
      .split(",")
      .map((person) => person.trim())
      .filter(Boolean);
  }

  return [];
}

function getPeriodStart(period: Period): Date {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const days = period === "7 days" ? 7 : period === "30 days" ? 30 : 90;
  start.setDate(start.getDate() - days + 1);

  return start;
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>("7 days");
  const [meetings, setMeetings] = useState<Meeting[]>(() =>
    readArray<Meeting>(MEETINGS_KEY)
  );
  const [tasks, setTasks] = useState<Task[]>(() =>
    readArray<Task>(TASKS_KEY)
  );

  useEffect(() => {
    const refreshData = () => {
      setMeetings(readArray<Meeting>(MEETINGS_KEY));
      setTasks(readArray<Task>(TASKS_KEY));
    };

    window.addEventListener("storage", refreshData);
    window.addEventListener("intellmeet_meetings_updated", refreshData);
    window.addEventListener("intellmeet_tasks_updated", refreshData);

    return () => {
      window.removeEventListener("storage", refreshData);
      window.removeEventListener("intellmeet_meetings_updated", refreshData);
      window.removeEventListener("intellmeet_tasks_updated", refreshData);
    };
  }, []);

  const startDate = useMemo(() => getPeriodStart(period), [period]);

  const filteredMeetings = useMemo(
    () =>
      meetings.filter((meeting) => {
        const date = parseMeetingDate(meeting);
        return date !== null && date >= startDate && date <= new Date();
      }),
    [meetings, startDate]
  );

  const filteredTasks = useMemo(
    () =>
      tasks.filter((task) => {
        if (!task.dueDate) return true;

        const date = new Date(task.dueDate);
        if (Number.isNaN(date.getTime())) return true;

        const end = new Date();
        end.setHours(23, 59, 59, 999);

        return date >= startDate && date <= end;
      }),
    [tasks, startDate]
  );

  const meetingTotal = filteredMeetings.length;

  const totalMinutes = filteredMeetings.reduce(
    (sum, meeting) => sum + getDuration(meeting),
    0
  );

  const hourTotal = Math.round((totalMinutes / 60) * 10) / 10;

  const completedTasks = filteredTasks.filter(isTaskCompleted).length;
  const pendingTasks = filteredTasks.length - completedTasks;

  const completionRate =
    filteredTasks.length > 0
      ? Math.round((completedTasks / filteredTasks.length) * 100)
      : 0;

  const participantCount = new Set(
    filteredMeetings.flatMap(getParticipantList)
  ).size;

  const chartData = useMemo(() => {
    const days = period === "7 days" ? 7 : period === "30 days" ? 30 : 90;

    return Array.from({ length: days }, (_, index) => {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + index);

      const dayMeetings = filteredMeetings.filter((meeting) => {
        const meetingDate = parseMeetingDate(meeting);

        return (
          meetingDate !== null &&
          meetingDate.getFullYear() === date.getFullYear() &&
          meetingDate.getMonth() === date.getMonth() &&
          meetingDate.getDate() === date.getDate()
        );
      });

      return {
        date,
        label:
          days === 7
            ? date.toLocaleDateString("en-US", { weekday: "short" })
            : date.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              }),
        meetings: dayMeetings.length,
        hours:
          Math.round(
            (dayMeetings.reduce(
              (sum, meeting) => sum + getDuration(meeting),
              0
            ) /
              60) *
              10
          ) / 10,
      };
    });
  }, [period, startDate, filteredMeetings]);

  const maxMeetings = Math.max(
    1,
    ...chartData.map((item) => item.meetings)
  );

  const maxHours = Math.max(
    1,
    ...chartData.map((item) => item.hours)
  );

  function exportReport() {
    const rows: (string | number)[][] = [
      ["Metric", "Value"],
      ["Reporting period", period],
      ["Total meetings", meetingTotal],
      ["Meeting hours", hourTotal],
      ["Total tasks", filteredTasks.length],
      ["Tasks completed", completedTasks],
      ["Tasks pending", pendingTasks],
      ["Task completion rate", `${completionRate}%`],
      ["Unique participants", participantCount],
      [],
      ["Date", "Meetings", "Meeting hours"],
      ...chartData.map((item) => [
        item.date.toLocaleDateString("en-CA"),
        item.meetings,
        item.hours,
      ]),
      [],
      ["Task title", "Status", "Due date"],
      ...filteredTasks.map((task) => [
        task.title || "Untitled task",
        isTaskCompleted(task) ? "Completed" : "Pending",
        task.dueDate || "",
      ]),
    ];

    const csv = rows
      .map((row) =>
        row
          .map((cell) => {
            const value = String(cell ?? "");
            return `"${value.replace(/"/g, '""')}"`;
          })
          .join(",")
      )
      .join("\r\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `intellmeet-analytics-${period.replace(" ", "-")}.csv`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const durationGroups = [
    { label: "Under 15 min", color: "purple", count: 0 },
    { label: "15–30 min", color: "blue", count: 0 },
    { label: "30–60 min", color: "green", count: 0 },
    { label: "Over 60 min", color: "orange", count: 0 },
  ];

  filteredMeetings.forEach((meeting) => {
    const duration = getDuration(meeting);

    if (duration < 15) durationGroups[0].count += 1;
    else if (duration < 30) durationGroups[1].count += 1;
    else if (duration <= 60) durationGroups[2].count += 1;
    else durationGroups[3].count += 1;
  });

  return (
    <section className="analytics-page">
      <SectionHeading
        eyebrow="PERFORMANCE INSIGHTS"
        title="Analytics"
        subtitle="Review meeting activity and task progress from your saved workspace data."
        action={
          <button className="analytics-export-btn" onClick={exportReport}>
            <Download size={17} />
            Export CSV
          </button>
        }
      />

      <div className="analytics-toolbar">
        <div className="analytics-period-label">
          <CalendarDays size={17} />
          <span>Reporting period</span>
        </div>

        <div className="analytics-period-control">
          {(["7 days", "30 days", "90 days"] as Period[]).map((item) => (
            <button
              key={item}
              className={period === item ? "active" : ""}
              onClick={() => setPeriod(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="analytics-stat-grid">
        <article className="analytics-stat-card">
          <div className="analytics-stat-top">
            <span>Total meetings</span>
            
          </div>
          <strong>{meetingTotal}</strong>
      
        </article>

        <article className="analytics-stat-card">
          <div className="analytics-stat-top">
            <span>Meeting hours</span>
          </div>
          <strong>{hourTotal}h</strong>
        
        </article>

        <article className="analytics-stat-card">
          <div className="analytics-stat-top">
            <span>Tasks completed</span>
          
          </div>
          <strong>{completedTasks}</strong>
           
        </article>

        <article className="analytics-stat-card">
          <div className="analytics-stat-top">
            <span>Participants</span>
            
          </div>
          <strong>{participantCount}</strong>
          <small>Unique participant names recorded</small>
        </article>
      </div>

      <div className="analytics-main-grid">
        <article className="analytics-panel analytics-activity-panel">
          <div className="analytics-panel-heading">
            <div>
              <h2>Meeting activity</h2>
              <p>Meetings recorded during the selected period</p>
            </div>
         
          </div>

          {meetingTotal === 0 ? (
            <div className="workspace-empty">
             
              <h3>No meeting activity yet</h3>
              <p>Create meetings with dates to see your analytics here.</p>
            </div>
          ) : (
            <div className="analytics-chart">
              <div className="analytics-y-labels">
                <span>{maxMeetings}</span>
                <span>{Math.round(maxMeetings * 0.75)}</span>
                <span>{Math.round(maxMeetings * 0.5)}</span>
                <span>{Math.round(maxMeetings * 0.25)}</span>
                <span>0</span>
              </div>

              <div className="analytics-bars-area">
                <div className="analytics-grid-lines">
                  {[0, 1, 2, 3, 4].map((line) => (
                    <span key={line} />
                  ))}
                </div>

                {chartData.map((item) => (
                  <div
                    className="analytics-bar-column"
                    key={item.date.toISOString()}
                  >
                    <div className="analytics-bar-track">
                      <div
                        className="analytics-bar"
                        style={{
                          height: `${(item.meetings / maxMeetings) * 100}%`,
                        }}
                        title={`${item.meetings} meetings`}
                      />
                    </div>
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="analytics-chart-note">
            <span>Charts use meetings saved in this browser.</span>
          </div>
        </article>

        <article className="analytics-panel">
          <div className="analytics-panel-heading">
            <div>
              <h2>Task completion</h2>
              <p>Saved task status breakdown</p>
            </div>
          </div>

          <div className="analytics-task-total">
            <strong>{filteredTasks.length}</strong>
            <span>Total tracked tasks</span>
          </div>

          <div className="analytics-task-progress">
            {[
              {
                label: "Completed",
                value: completedTasks,
                color: "green",
              },
              {
                label: "Pending",
                value: pendingTasks,
                color: "orange",
              },
            ].map((item) => {
              const percentage =
                filteredTasks.length > 0
                  ? Math.round((item.value / filteredTasks.length) * 100)
                  : 0;

              return (
                <div className="analytics-task-row" key={item.label}>
                  <div className="analytics-task-label">
                    <span>
                      <i className={item.color} />
                      {item.label}
                    </span>
                    <strong>{percentage}%</strong>
                  </div>
                  <div className="analytics-progress-track">
                    <div
                      className={item.color}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

         
        </article>
      </div>

      <div className="analytics-bottom-grid">
        <article className="analytics-panel">
          <div className="analytics-panel-heading">
            <div>
              <h2>Meeting duration</h2>
              <p>Distribution of saved meeting lengths</p>
            </div>
          </div>

          {meetingTotal === 0 ? (
            <p className="analytics-footnote">
              No meetings with recorded dates are available for this period.
            </p>
          ) : (
            <div className="analytics-duration-list">
              {durationGroups.map((item) => {
                const percentage = Math.round(
                  (item.count / meetingTotal) * 100
                );

                return (
                  <div
                    className="analytics-duration-row"
                    key={item.label}
                  >
                    <span className="analytics-duration-dot">
                      <i className={item.color} />
                    </span>
                    <span className="analytics-duration-label">
                      {item.label}
                    </span>
                    <div className="analytics-duration-track">
                      <div
                        className={item.color}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <strong>{percentage}%</strong>
                  </div>
                );
              })}
            </div>
          )}

          <p className="analytics-footnote">
            Duration statistics depend on the duration values saved for each meeting.
          </p>
        </article>

        <article className="analytics-insight-card">
          
          <span className="analytics-insight-eyebrow">
            WORKSPACE INSIGHT
          </span>
          <h2>Track progress with your own data.</h2>
          <p>
            Schedule meetings, update tasks, and revisit this page to review
            your recorded collaboration activity.
          </p>

          <div className="analytics-insight-metric">
            <div>
              <span>Task completion rate</span>
              <strong>{completionRate}%</strong>
            </div>
            <div className="analytics-mini-track">
              <span style={{ width: `${completionRate}%` }} />
            </div>
          </div>
        </article>
      </div>

      <p className="analytics-disclaimer">
        Analytics are calculated from data stored in this browser. Shared
        multi-user analytics require backend database integration.
      </p>
    </section>
  );
}
