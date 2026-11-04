import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import SectionHeading from "../components/SectionHeading";
import StatCard from "../components/StatCard";
import MeetingCard, { type Meeting } from "../components/MeetingCard";
import "./DashboardPage.css";

const MEETINGS_KEY = "intellmeet_meetings";
const TASKS_KEY = "intellmeet_tasks";

type Task = {
  id: string;
  title: string;
  project?: string;
  dueDate?: string;
  priority?: string;
  completed?: boolean;
};

function getMeetings(): Meeting[] {
  try {
    return JSON.parse(localStorage.getItem(MEETINGS_KEY) || "[]");
  } catch {
    return [];
  }
}

function getTasks(): Task[] {
  try {
    return JSON.parse(localStorage.getItem(TASKS_KEY) || "[]");
  } catch {
    return [];
  }
}

function getUserName() {
  return (
    localStorage.getItem("intellmeet_user_name") ||
    localStorage.getItem("userName") ||
    localStorage.getItem("name") ||
    "User"
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();

  const [meetings, setMeetings] = useState<Meeting[]>(getMeetings);
  const [tasks, setTasks] = useState<Task[]>(getTasks);
  const [search, setSearch] = useState("");
  const [userName] = useState(getUserName);

  useEffect(() => {
    const refresh = () => {
      setMeetings(getMeetings());
      setTasks(getTasks());
    };

    window.addEventListener("storage", refresh);
    window.addEventListener("intellmeet_meetings_updated", refresh);

    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("intellmeet_meetings_updated", refresh);
    };
  }, []);

  const query = search.toLowerCase().trim();

  const filteredMeetings = meetings.filter((meeting) =>
    [meeting.title, meeting.category, meeting.date, meeting.time]
      .some((value) => String(value ?? "").toLowerCase().includes(query))
  );

  const completedTasks = tasks.filter((task) => task.completed).length;

  const upcomingCount = meetings.filter(
    (meeting) => meeting.status !== "Completed"
  ).length;

  function joinMeeting(meeting: Meeting) {
    if (meeting.status === "Completed") return;

    navigate(`/meeting/${encodeURIComponent(meeting.id)}`);
  }

  return (
    <div className="dashboard-page">
      <SectionHeading
        eyebrow="YOUR WORKSPACE"
        title={`Welcome, ${userName}`}
        subtitle="Manage your meetings and tasks in one place."
        action={
          <button
            className="dashboard-primary-button"
            onClick={() => navigate("/meetings")}
          >
            + Create Meeting
          </button>
        }
      />

      <section className="dashboard-stats">
        <StatCard title="Total Meetings" value={meetings.length} change="Your meetings" description="Saved meetings" />
        <StatCard title="Upcoming Meetings" value={upcomingCount} change="Scheduled" description="Meetings remaining" />
        <StatCard title="Tasks Completed" value={`${completedTasks}/${tasks.length}`} change="Your tasks" description="Completed tasks" />
        <StatCard title="Pending Tasks" value={tasks.length - completedTasks} change="Remaining" description="Tasks pending" />
      </section>

      <section className="dashboard-section">
        <div className="dashboard-section-heading">
          <div>
            <h2>Meetings</h2>
            <p>Your scheduled meetings</p>
          </div>
        </div>

        <input
          className="meeting-search"
          type="search"
          placeholder="Search meetings..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <div className="dashboard-meeting-grid">
          {filteredMeetings.length > 0 ? (
            filteredMeetings.map((meeting) => (
              <MeetingCard
                key={meeting.id}
                meeting={meeting}
                onJoin={joinMeeting}
              />
            ))
          ) : (
            <p>
              {query ? "No matching meetings found." : "No meetings scheduled yet."}
            </p>
          )}
        </div>
      </section>

      <section className="dashboard-section">
        <h2>Tasks & Action Items</h2>

        {tasks.length > 0 ? (
          tasks.map((task) => (
            <div className="dashboard-task-item" key={task.id}>
              <div>
                <h3>{task.title}</h3>
                {task.project && <p>{task.project}</p>}
                {task.dueDate && <p>Due: {task.dueDate}</p>}
              </div>
              <span>{task.completed ? "Completed" : "Pending"}</span>
            </div>
          ))
        ) : (
          <p>No tasks available.</p>
        )}
      </section>
    </div>
  );
}