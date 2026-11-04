
import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Circle,
  ClipboardList,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import SectionHeading from "../components/SectionHeading";
import type { Task } from "../components/TaskList";
import "./TasksPage.css";

type TaskFilter = "All" | "Pending" | "Completed";
type Priority = "High" | "Medium" | "Low";

const STORAGE_KEY = "intellmeet_tasks";

function loadTasks(): Task[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return [];

    const parsed: unknown = JSON.parse(saved);
    return Array.isArray(parsed) ? (parsed as Task[]) : [];
  } catch {
    return [];
  }
}

function saveTasks(tasks: Task[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  window.dispatchEvent(new Event("intellmeet_tasks_updated"));
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>(loadTasks);
  const [filter, setFilter] = useState<TaskFilter>("All");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [title, setTitle] = useState("");
  const [project, setProject] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState<Priority>("Medium");

  useEffect(() => {
    const refreshTasks = () => setTasks(loadTasks());

    window.addEventListener("storage", refreshTasks);

    return () => {
      window.removeEventListener("storage", refreshTasks);
    };
  }, []);

  const completedCount = tasks.filter(
    (task) => task.completed
  ).length;

  const pendingCount = tasks.length - completedCount;

  const progress =
    tasks.length === 0
      ? 0
      : Math.round((completedCount / tasks.length) * 100);

  const visibleTasks = useMemo(() => {
    const query = search.trim().toLowerCase();

    return tasks.filter((task) => {
      const matchesFilter =
        filter === "All" ||
        (filter === "Completed" && task.completed) ||
        (filter === "Pending" && !task.completed);

      const matchesSearch = [
        task.title,
        task.project,
        task.dueDate,
        task.priority,
        task.completed ? "completed" : "pending",
      ].some((value) =>
        String(value ?? "").toLowerCase().includes(query)
      );

      return matchesFilter && matchesSearch;
    });
  }, [tasks, filter, search]);

  function addTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: title.trim(),
      project: project.trim(),
      dueDate,
      priority,
      completed: false,
    };

    const updatedTasks = [newTask, ...tasks];

    saveTasks(updatedTasks);
    setTasks(updatedTasks);

    setTitle("");
    setProject("");
    setDueDate("");
    setPriority("Medium");
    setFilter("All");
    setSearch("");
    setShowForm(false);
  }

  function toggleTask(taskId: string) {
    const updatedTasks = tasks.map((task) =>
      task.id === taskId
        ? { ...task, completed: !task.completed }
        : task
    );

    saveTasks(updatedTasks);
    setTasks(updatedTasks);
  }

  function deleteTask(taskId: string) {
    if (!window.confirm("Are you sure you want to delete this task?")) {
      return;
    }

    const updatedTasks = tasks.filter(
      (task) => task.id !== taskId
    );

    saveTasks(updatedTasks);
    setTasks(updatedTasks);
  }

  const today = new Date();
  const minDate = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");

  return (
    <section className="tasks-page">
      <SectionHeading
        eyebrow="WORK MANAGEMENT"
        title="My Tasks"
        subtitle="Create and manage your own tasks."
        action={
          <button
            className="tasks-primary-btn"
            onClick={() => setShowForm(true)}
          >
            <Plus size={18} />
            Add Task
          </button>
        }
      />

      <div className="tasks-stats">
        <article className="tasks-stat-card">
          
          <span>Total tasks</span>
          <strong>{tasks.length}</strong>
          <small>Your saved tasks</small>
        </article>

        <article className="tasks-stat-card">
          
          <span>Pending</span>
          <strong>{pendingCount}</strong>
          <small>Waiting to be completed</small>
        </article>

        <article className="tasks-stat-card">
          
          <span>Completed</span>
          <strong>{completedCount}</strong>
          <small>Tasks finished</small>
        </article>

        <article className="tasks-stat-card tasks-progress-card">
          <span>Completion rate</span>
          <strong>{progress}%</strong>
          <div
            className="tasks-progress-track"
            role="progressbar"
            aria-label="Task completion rate"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div style={{ width: `${progress}%` }} />
          </div>
          <small>Your overall task progress</small>
        </article>
      </div>

      <div className="tasks-toolbar">
        <div className="tasks-search">
          <Search size={18} />
          <input
            type="search"
            placeholder="Search your tasks or projects..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className="tasks-filter-tabs">
          {(["All", "Pending", "Completed"] as TaskFilter[]).map(
            (item) => (
              <button
                key={item}
                className={filter === item ? "active" : ""}
                onClick={() => setFilter(item)}
              >
                {item}
                <span>
                  {item === "All"
                    ? tasks.length
                    : item === "Pending"
                      ? pendingCount
                      : completedCount}
                </span>
              </button>
            )
          )}
        </div>
      </div>

      <div className="tasks-list-panel">
        <div className="tasks-list-heading">
          <div>
            <h2>Task list</h2>
            <p>Your manually created tasks appear here.</p>
          </div>
          <span className="tasks-result-count">
            {visibleTasks.length} tasks
          </span>
        </div>

        {visibleTasks.length === 0 ? (
          <div className="tasks-empty">
            <h3>
              {search || filter !== "All"
                ? "No matching tasks"
                : "No tasks yet"}
            </h3>
            <p>
              {search || filter !== "All"
                ? "Try changing your search or filter."
                : "Add your first task to get started."}
            </p>
            <button
              className="tasks-primary-btn"
              onClick={() => setShowForm(true)}
            >
              <Plus size={17} />
              Add Task
            </button>
          </div>
        ) : (
          <div className="tasks-table-wrap">
            <table className="tasks-table">
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Project</th>
                  <th>Due date</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {visibleTasks.map((task) => (
                  <tr key={task.id}>
                    <td>
                      <button
                        className={`task-check ${
                          task.completed ? "checked" : ""
                        }`}
                        onClick={() => toggleTask(task.id)}
                        aria-label={
                          task.completed
                            ? "Mark pending"
                            : "Mark completed"
                        }
                      >
                        {task.completed ? (
                          <CheckCircle2 size={19} />
                        ) : (
                          <Circle size={19} />
                        )}
                      </button>
                      <span
                        className={`task-title ${
                          task.completed ? "done" : ""
                        }`}
                      >
                        {task.title}
                      </span>
                    </td>

                    <td>
                      <span className="task-project">
                        {task.project || "—"}
                      </span>
                    </td>

                    <td>
                      <span className="task-date">
                        {task.dueDate
                          ? new Date(
                              `${task.dueDate}T12:00:00`
                            ).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          : "No date"}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`task-priority ${
                          (task.priority || "Medium").toLowerCase()
                        }`}
                      >
                        <span />
                        {task.priority || "Medium"}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`task-status ${
                          task.completed ? "complete" : "pending"
                        }`}
                      >
                        {task.completed ? "Completed" : "Pending"}
                      </span>
                    </td>

                    <td>
                      <button
                        className="task-delete-btn"
                        onClick={() => deleteTask(task.id)}
                        aria-label={`Delete ${task.title}`}
                        title="Delete task"
                      >
                        <Trash2 size={17} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <div className="tasks-modal-backdrop">
          <form className="tasks-form" onSubmit={addTask}>
            <div className="tasks-form-heading">
              <div>
                <span>WORK MANAGEMENT</span>
                <h2>Create a task</h2>
              </div>

              <button
                type="button"
                className="tasks-close-btn"
                onClick={() => setShowForm(false)}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <label htmlFor="task-title">Task name</label>
            <input
              id="task-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="What needs to be done?"
              required
              maxLength={120}
            />

            <label htmlFor="task-project">Project</label>
            <input
              id="task-project"
              value={project}
              onChange={(event) => setProject(event.target.value)}
              placeholder="Project name"
              required
              maxLength={80}
            />

            <label htmlFor="task-due-date">Due date</label>
            <input
              id="task-due-date"
              type="date"
              min={minDate}
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              required
            />

            <label htmlFor="task-priority">Priority</label>
            <select
              id="task-priority"
              value={priority}
              onChange={(event) =>
                setPriority(event.target.value as Priority)
              }
            >
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>

            <button type="submit" className="tasks-submit-btn">
              <Plus size={18} />
              Create Task
            </button>

            <p className="tasks-demo-note">
              Tasks are saved in this browser.
            </p>
          </form>
        </div>
      )}
    </section>
  );
}
