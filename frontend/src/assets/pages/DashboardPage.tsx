
import { useEffect, useState } from "react";
import SectionHeading from "../components/SectionHeading";
import StatCard from "../components/StatCard";
import MeetingCard, { type Meeting } from "../components/MeetingCard";
import "./DashboardPage.css";

const MEETINGS_STORAGE_KEY = "intellmeet_meetings";
const TASKS_STORAGE_KEY = "intellmeet_tasks";

type Task = {
  id: string;
  title: string;
  project?: string;
  dueDate?: string;
  priority?: string;
  completed?: boolean;
};

function getSavedName(): string {
  try {
    const savedUser = localStorage.getItem("user");

    if (savedUser) {
      const user = JSON.parse(savedUser);

      if (user.name) return user.name;
      if (user.firstName) return user.firstName;
      if (user.fullName) return user.fullName;
    }
  } catch {
    // Check other saved values below.
  }

  const name =
    localStorage.getItem("userName") ||
    localStorage.getItem("name");

  if (name) return name;

  const email =
    localStorage.getItem("userEmail") ||
    localStorage.getItem("email");

  if (email) {
    return email.split("@")[0].split(/[._-]/)[0];
  }

  return "User";
}

function getSavedMeetings(): Meeting[] {
  try {
    const saved = localStorage.getItem(MEETINGS_STORAGE_KEY);

    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    console.error("Unable to read saved meetings.");
  }

  return [];
}

function getSavedTasks(): Task[] {
  try {
    const saved = localStorage.getItem(TASKS_STORAGE_KEY);

    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    console.error("Unable to read saved tasks.");
  }

  return [];
}

export default function DashboardPage() {
  const [search, setSearch] = useState("");
  const [userName, setUserName] = useState(getSavedName);
  const [meetings, setMeetings] = useState<Meeting[]>(getSavedMeetings);
  const [tasks, setTasks] = useState<Task[]>(getSavedTasks);

  useEffect(() => {
    const refreshDashboard = () => {
      setUserName(getSavedName());
      setMeetings(getSavedMeetings());
      setTasks(getSavedTasks());
    };

    window.addEventListener("storage", refreshDashboard);
    window.addEventListener("intellmeet_meetings_updated", refreshDashboard);
    window.addEventListener("intellmeet_tasks_updated", refreshDashboard);
    window.addEventListener("user_updated", refreshDashboard);

    return () => {
      window.removeEventListener("storage", refreshDashboard);
      window.removeEventListener(
        "intellmeet_meetings_updated",
        refreshDashboard
      );
      window.removeEventListener(
        "intellmeet_tasks_updated",
        refreshDashboard
      );
      window.removeEventListener("user_updated", refreshDashboard);
    };
  }, []);

  const query = search.trim().toLowerCase();

  const filteredMeetings = meetings.filter((meeting) =>
    [
      meeting.title,
      meeting.category,
      meeting.date,
      meeting.time,
      meeting.duration,
      meeting.status ?? "",
      ...(meeting.participants ?? []),
    ].some((value) =>
      String(value ?? "").toLowerCase().includes(query)
    )
  );

  const filteredTasks = tasks.filter((task) =>
    [
      task.title,
      task.project ?? "",
      task.dueDate ?? "",
      task.priority ?? "",
      task.completed ? "completed" : "pending",
    ].some((value) =>
      String(value ?? "").toLowerCase().includes(query)
    )
  );

  const upcomingCount = meetings.filter(
    (meeting) =>
      (meeting.status ?? "Upcoming").toLowerCase() !== "completed"
  ).length;

  const completedTasks = tasks.filter(
    (task) => task.completed
  ).length;

  return (
    <div className="dashboard-page">
      <SectionHeading
        eyebrow="YOUR WORKSPACE"
        title={`Welcome, ${userName} `}
        subtitle="Manage your meetings and tasks in one place."
        action={
          <button
            className="dashboard-primary-button"
            onClick={() => {
              window.location.href = "/meetings";
            }}
          >
            + Create meeting
          </button>
        }
      />

      <section className="dashboard-stats">
        <StatCard
          title="Total Meetings"
          value={meetings.length}
          change="Your meetings"
          description="meetings saved in your workspace"
  
        />

        <StatCard
          title="Upcoming Meetings"
          value={upcomingCount}
          change="Scheduled"
          description="meetings not yet completed"
         />

        <StatCard
          title="Tasks Completed"
          value={`${completedTasks}/${tasks.length}`}
          change="Your tasks"
          description="completed tasks"
          />

        <StatCard
          title="Pending Tasks"
          value={tasks.length - completedTasks}
          change="Remaining"
          description="tasks waiting to be completed"
  
        />
      </section>

      <section className="dashboard-section">
        <div className="dashboard-section-heading">
          <div>
            <h2>Meetings</h2>
            <p>Your manually created meetings appear here.</p>
          </div>
        </div>

        <input
          className="meeting-search"
          type="search"
          placeholder="Search your meetings and tasks..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          aria-label="Search your meetings and tasks"
        />

        <div className="dashboard-meeting-grid">
          {filteredMeetings.length > 0 ? (
            filteredMeetings.map((meeting) => (
              <MeetingCard
                key={meeting.id}
                meeting={meeting}
                onJoin={(selectedMeeting) =>
                  alert(
                    `Meeting: ${selectedMeeting.title}\nVideo calling is not connected yet.`
                  )
                }
              />
            ))
          ) : (
            <p className="dashboard-no-results">
              {query
                ? "No matching meetings found."
                : "No meetings yet. Click Create Meeting to add your first meeting."}
            </p>
          )}
        </div>
      </section>

      <section className="dashboard-section dashboard-tasks-section">
        <div className="dashboard-section-heading">
          <div>
            <h2>Tasks & Action Items</h2>
            <p>Your manually created tasks appear here.</p>
          </div>
        </div>

        {filteredTasks.length > 0 ? (
          <div className="dashboard-manual-tasks">
            {filteredTasks.map((task) => (
              <div className="dashboard-task-item" key={task.id}>
                <div>
                  <h3>{task.title}</h3>
                  {task.project && <p>Project: {task.project}</p>}
                  {task.dueDate && <p>Due: {task.dueDate}</p>}
                  {task.priority && <p>Priority: {task.priority}</p>}
                </div>

                <span>
                  {task.completed ? "Completed" : "Pending"}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="dashboard-no-results">
            {query
              ? "No matching tasks found."
              : "No tasks yet. Add tasks from your Tasks page."}
          </p>
        )}
      </section>

      <footer className="dashboard-footer">
        IntellMeet · AI-powered collaboration
        <span>Your workspace</span>
      </footer>
    </div>
  );
}
