
import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Download } from "lucide-react";
import { jsPDF } from "jspdf";
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
  return Number.isNaN(date.getTime()) ? null : date;
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

function formatDate(dateValue?: string): string {
  if (!dateValue) return "Not set";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) return dateValue;

  return date.toLocaleDateString();
}

function safePdfText(value: unknown): string {
  return String(value ?? "")
    .replace(/[\r\n]+/g, " ")
    .trim();
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

  const maxMeetings = Math.max(1, ...chartData.map((item) => item.meetings));

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

  // PDF export
  function exportReport() {
    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - margin * 2;
      const bottomMargin = 18;
      let y = 53;

      function addPageIfNeeded(requiredHeight: number) {
        if (y + requiredHeight > pageHeight - bottomMargin) {
          pdf.addPage();
          y = 20;
        }
      }

      function drawSectionTitle(title: string) {
        addPageIfNeeded(16);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(13);
        pdf.setTextColor(45, 50, 65);
        pdf.text(title, margin, y);
        y += 9;
      }

      function drawTableHeader(
        columns: { title: string; x: number }[]
      ) {
        addPageIfNeeded(12);
        pdf.setFillColor(79, 70, 229);
        pdf.rect(margin, y - 5, contentWidth, 10, "F");

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(8);
        pdf.setTextColor(255, 255, 255);

        columns.forEach((column) => {
          pdf.text(column.title, column.x, y + 1);
        });

        y += 9;
      }

      // Report header
      pdf.setFillColor(79, 70, 229);
      pdf.rect(0, 0, pageWidth, 39, "F");

      pdf.setTextColor(255, 255, 255);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(21);
      pdf.text("IntellMeet", margin, 16);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(11);
      pdf.text("Analytics Report", margin, 27);

      pdf.setFontSize(9);
      pdf.text(`Reporting period: ${period}`, pageWidth - margin, 27, {
        align: "right",
      });

      // Summary
      drawSectionTitle("Performance Summary");

      const summaryRows: [string, string][] = [
        ["Report generated", new Date().toLocaleString()],
        ["Reporting period", period],
        ["Total meetings", String(meetingTotal)],
        ["Meeting hours", `${hourTotal} hours`],
        ["Total tasks", String(filteredTasks.length)],
        ["Tasks completed", String(completedTasks)],
        ["Tasks pending", String(pendingTasks)],
        ["Task completion rate", `${completionRate}%`],
        ["Unique participants", String(participantCount)],
      ];

      summaryRows.forEach(([label, value], index) => {
        addPageIfNeeded(10);

        if (index % 2 === 0) {
          pdf.setFillColor(248, 249, 253);
          pdf.rect(margin, y - 5, contentWidth, 9, "F");
        }

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(9);
        pdf.setTextColor(85, 93, 112);
        pdf.text(label, margin + 3, y + 1);

        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(35, 42, 58);
        pdf.text(
          pdf.splitTextToSize(value, contentWidth - 70),
          margin + 70,
          y + 1
        );

        y += 9;
      });

      // Daily meeting activity
      y += 8;
      drawSectionTitle("Meeting Activity");

      const activityColumns = [
        { title: "Date", x: margin + 3 },
        { title: "Meetings", x: margin + 77 },
        { title: "Hours", x: margin + 127 },
      ];

      drawTableHeader(activityColumns);

      chartData.forEach((item, index) => {
        addPageIfNeeded(9);

        if (index % 2 === 0) {
          pdf.setFillColor(248, 249, 253);
          pdf.rect(margin, y - 5, contentWidth, 8, "F");
        }

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(8);
        pdf.setTextColor(45, 50, 65);

        pdf.text(item.date.toLocaleDateString(), margin + 3, y);
        pdf.text(String(item.meetings), margin + 77, y);
        pdf.text(String(item.hours), margin + 127, y);

        y += 8;
      });

      // Task details
      y += 8;
      drawSectionTitle("Task Details");

      drawTableHeader([
        { title: "Task", x: margin + 3 },
        { title: "Status", x: margin + 105 },
        { title: "Due date", x: margin + 145 },
      ]);

      if (filteredTasks.length === 0) {
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(9);
        pdf.setTextColor(100, 100, 100);
        pdf.text("No tasks recorded for this reporting period.", margin + 3, y);
        y += 9;
      } else {
        filteredTasks.forEach((task, index) => {
          const title = safePdfText(task.title || "Untitled task");
          const titleLines = pdf.splitTextToSize(title, 94);
          const rowHeight = Math.max(9, titleLines.length * 4.5 + 3);

          addPageIfNeeded(rowHeight);

          if (index % 2 === 0) {
            pdf.setFillColor(248, 249, 253);
            pdf.rect(margin, y - 5, contentWidth, rowHeight, "F");
          }

          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(8);
          pdf.setTextColor(45, 50, 65);

          pdf.text(titleLines, margin + 3, y);
          pdf.text(
            isTaskCompleted(task) ? "Completed" : "Pending",
            margin + 105,
            y
          );
          pdf.text(formatDate(task.dueDate), margin + 145, y);

          y += rowHeight + 2;
        });
      }

      // Meeting details
      y += 8;
      drawSectionTitle("Meeting Details");

      drawTableHeader([
        { title: "Meeting", x: margin + 3 },
        { title: "Date", x: margin + 93 },
        { title: "Duration", x: margin + 133 },
      ]);

      if (filteredMeetings.length === 0) {
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(9);
        pdf.setTextColor(100, 100, 100);
        pdf.text("No meetings recorded for this reporting period.", margin + 3, y);
        y += 9;
      } else {
        filteredMeetings.forEach((meeting, index) => {
          const title = safePdfText(meeting.title || "Untitled meeting");
          const titleLines = pdf.splitTextToSize(title, 83);
          const rowHeight = Math.max(9, titleLines.length * 4.5 + 3);

          addPageIfNeeded(rowHeight);

          if (index % 2 === 0) {
            pdf.setFillColor(248, 249, 253);
            pdf.rect(margin, y - 5, contentWidth, rowHeight, "F");
          }

          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(8);
          pdf.setTextColor(45, 50, 65);

          pdf.text(titleLines, margin + 3, y);
          pdf.text(formatDate(meeting.date), margin + 93, y);
          pdf.text(`${getDuration(meeting)} min`, margin + 133, y);

          y += rowHeight + 2;
        });
      }

      // Footer and page numbers
      const totalPages = pdf.getNumberOfPages();

      for (let page = 1; page <= totalPages; page += 1) {
        pdf.setPage(page);

        pdf.setDrawColor(225, 229, 239);
        pdf.line(
          margin,
          pageHeight - 14,
          pageWidth - margin,
          pageHeight - 14
        );

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(8);
        pdf.setTextColor(130, 138, 153);

        pdf.text(
          `IntellMeet Analytics | Page ${page} of ${totalPages}`,
          margin,
          pageHeight - 8
        );
      }

      pdf.save(`intellmeet-analytics-${period.replace(" ", "-")}.pdf`);
    } catch (error) {
      console.error("PDF export failed:", error);
      window.alert("Unable to export the PDF. Please try again.");
    }
  }

  return (
    <section className="analytics-page">
      <SectionHeading
        eyebrow="PERFORMANCE INSIGHTS"
        title="Analytics"
        subtitle="Review meeting activity and task progress from your saved workspace data."
        action={
          <button
            type="button"
            className="analytics-export-btn"
            onClick={exportReport}
          >
            <Download size={17} />
            Export PDF
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
              type="button"
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
            Duration statistics depend on the duration values saved for each
            meeting.
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
