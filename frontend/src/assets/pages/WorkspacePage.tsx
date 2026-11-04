
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import {
  Users,
  FolderKanban,
  FileText,
  Plus,
  X,
  CheckCircle2,
  Trash2,
} from "lucide-react";
import SectionHeading from "../components/SectionHeading";
import "./WorkspacePage.css";

type Project = {
  id: number;
  name: string;
  description: string;
  color: string;
  progress: number;
  members: string[];
};

type TaskStatus = "To Do" | "In Progress" | "Done";
type TaskPriority = "High" | "Medium" | "Low";

type BoardTask = {
  id: number;
  title: string;
  project: string;
  priority: TaskPriority;
  status: TaskStatus;
};

type WorkspaceNote = {
  id: number;
  title: string;
  text: string;
  author: string;
  date: string;
};

type Tab = "Projects" | "Board" | "Notes" | "Team";

const PROJECTS_KEY = "intellmeet_workspace_projects";
const BOARD_TASKS_KEY = "intellmeet_workspace_board_tasks";
const NOTES_KEY = "intellmeet_workspace_notes";

function readStorage<T,>(key: string): T[] {
  try {
    const saved = localStorage.getItem(key);
    if (!saved) return [];

    const parsed: unknown = JSON.parse(saved);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch (error) {
    console.error(`Unable to read ${key}:`, error);
    return [];
  }
}

function writeStorage<T,>(key: string, value: T[]): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new Event("intellmeet_workspace_updated"));
    return true;
  } catch (error) {
    console.error(`Unable to save ${key}:`, error);
    window.alert(
      "Data save ஆகவில்லை. Browser storage available-ஆ இருக்கிறதா check பண்ணவும்."
    );
    return false;
  }
}

function getUserName(): string {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    return (
      user.name ||
      user.firstName ||
      user.fullName ||
      localStorage.getItem("userName") ||
      localStorage.getItem("name") ||
      "Current User"
    );
  } catch {
    return localStorage.getItem("userName") || "Current User";
  }
}

export default function WorkspacePage() {
  const [projects, setProjects] = useState<Project[]>(() =>
    readStorage<Project>(PROJECTS_KEY)
  );

  const [boardTasks, setBoardTasks] = useState<BoardTask[]>(() =>
    readStorage<BoardTask>(BOARD_TASKS_KEY)
  );

  const [notes, setNotes] = useState<WorkspaceNote[]>(() =>
    readStorage<WorkspaceNote>(NOTES_KEY)
  );

  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("Projects");

  const [showProjectForm, setShowProjectForm] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showNoteForm, setShowNoteForm] = useState(false);

  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");

  const [taskTitle, setTaskTitle] = useState("");
  const [taskProject, setTaskProject] = useState("");
  const [taskPriority, setTaskPriority] =
    useState<TaskPriority>("Medium");

  const [noteTitle, setNoteTitle] = useState("");
  const [noteText, setNoteText] = useState("");

  const userName = getUserName();
  const userInitials =
    userName
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || "")
      .join("") || "CU";

  useEffect(() => {
    function syncData() {
      setProjects(readStorage<Project>(PROJECTS_KEY));
      setBoardTasks(readStorage<BoardTask>(BOARD_TASKS_KEY));
      setNotes(readStorage<WorkspaceNote>(NOTES_KEY));
    }

    window.addEventListener("storage", syncData);
    window.addEventListener("intellmeet_workspace_updated", syncData);

    return () => {
      window.removeEventListener("storage", syncData);
      window.removeEventListener("intellmeet_workspace_updated", syncData);
    };
  }, []);

  function persistProjects(updated: Project[]): boolean {
    if (!writeStorage(PROJECTS_KEY, updated)) return false;
    setProjects(updated);
    return true;
  }

  function persistTasks(updated: BoardTask[]): boolean {
    if (!writeStorage(BOARD_TASKS_KEY, updated)) return false;
    setBoardTasks(updated);
    return true;
  }

  function persistNotes(updated: WorkspaceNote[]): boolean {
    if (!writeStorage(NOTES_KEY, updated)) return false;
    setNotes(updated);
    return true;
  }

  const filteredProjects = projects.filter((project) =>
    `${project.name} ${project.description}`
      .toLowerCase()
      .includes(search.trim().toLowerCase())
  );

  const teamMembers = Array.from(
    new Set(projects.flatMap((project) => project.members))
  );

  function addProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = projectName.trim();
    const description = projectDescription.trim();

    if (!name || !description) {
      window.alert("Project name மற்றும் description enter பண்ணு.");
      return;
    }

    const duplicate = projects.some(
      (project) => project.name.toLowerCase() === name.toLowerCase()
    );

    if (duplicate) {
      window.alert("இந்த project name ஏற்கனவே உள்ளது.");
      return;
    }

    const newProject: Project = {
      id: Date.now(),
      name,
      description,
      color: "purple",
      progress: 0,
      members: [userInitials],
    };

    if (!persistProjects([newProject, ...projects])) return;

    setProjectName("");
    setProjectDescription("");
    setSearch("");
    setShowProjectForm(false);
    setActiveTab("Projects");
  }

  function deleteProject(projectId: number) {
    const project = projects.find((item) => item.id === projectId);
    if (!project) return;

    const confirmed = window.confirm(
      `"${project.name}" project-ஐ delete செய்ய வேண்டுமா? Related tasks-ம் delete ஆகும்.`
    );

    if (!confirmed) return;

    const updatedProjects = projects.filter(
      (item) => item.id !== projectId
    );

    const updatedTasks = boardTasks.filter(
      (task) => task.project !== project.name
    );

    if (!persistProjects(updatedProjects)) return;
    persistTasks(updatedTasks);
  }

  function updateProgress(projectId: number, progress: number) {
    const updated = projects.map((project) =>
      project.id === projectId
        ? { ...project, progress }
        : project
    );

    persistProjects(updated);
  }

  function addTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const title = taskTitle.trim();
    const project = taskProject.trim();

    if (!title || !project) {
      window.alert("Task title மற்றும் project select பண்ணு.");
      return;
    }

    const newTask: BoardTask = {
      id: Date.now(),
      title,
      project,
      priority: taskPriority,
      status: "To Do",
    };

    if (!persistTasks([newTask, ...boardTasks])) return;

    setTaskTitle("");
    setTaskProject("");
    setTaskPriority("Medium");
    setShowTaskForm(false);
    setActiveTab("Board");
  }

  function moveTask(taskId: number, status: TaskStatus) {
    const updated = boardTasks.map((task) =>
      task.id === taskId ? { ...task, status } : task
    );

    persistTasks(updated);
  }

  function deleteTask(taskId: number) {
    if (!window.confirm("இந்த task-ஐ delete செய்ய வேண்டுமா?")) return;

    persistTasks(boardTasks.filter((task) => task.id !== taskId));
  }

  function addNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const title = noteTitle.trim();
    const text = noteText.trim();

    if (!title || !text) {
      window.alert("Note title மற்றும் content enter பண்ணு.");
      return;
    }

    const newNote: WorkspaceNote = {
      id: Date.now(),
      title,
      text,
      author: userName,
      date: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      }),
    };

    if (!persistNotes([newNote, ...notes])) return;

    setNoteTitle("");
    setNoteText("");
    setShowNoteForm(false);
    setActiveTab("Notes");
  }

  function deleteNote(noteId: number) {
    if (!window.confirm("இந்த note-ஐ delete செய்ய வேண்டுமா?")) return;

    persistNotes(notes.filter((note) => note.id !== noteId));
  }

  function closeAllForms() {
    setShowProjectForm(false);
    setShowTaskForm(false);
    setShowNoteForm(false);
  }

  return (
    <section className="workspace-page">
      <SectionHeading
        eyebrow="TEAM COLLABORATION"
        title="Workspace"
        subtitle="Manage your projects, tasks, and notes in one place."
        action={
          <button
            type="button"
            className="workspace-primary-btn"
            onClick={() => setShowProjectForm(true)}
          >
            <Plus size={18} />
            New Project
          </button>
        }
      />

      {/* Overview */}
      <div className="workspace-overview">
        <article className="workspace-overview-card">
          <span>Projects</span>
          <strong>{projects.length}</strong>
          <small>Your saved projects</small>
        </article>

        <article className="workspace-overview-card">
          <span>Team members</span>
          <strong>{teamMembers.length}</strong>
          <small>Project member initials</small>
        </article>

        <article className="workspace-overview-card">
          <span>Active tasks</span>
          <strong>
            {boardTasks.filter((task) => task.status !== "Done").length}
          </strong>
          <small>To do and in progress</small>
        </article>

        <article className="workspace-overview-card">
          <span>Shared notes</span>
          <strong>{notes.length}</strong>
          <small>Saved notes</small>
        </article>
      </div>

      {/* Tabs */}
      <div className="workspace-tabs">
        {(["Projects", "Board", "Notes", "Team"] as const).map((tab) => (
          <button
            type="button"
            key={tab}
            className={activeTab === tab ? "active" : ""}
            onClick={() => setActiveTab(tab)}
          >
            {tab === "Projects" && <FolderKanban size={16} />}
            {tab === "Board" && <CheckCircle2 size={16} />}
            {tab === "Notes" && <FileText size={16} />}
            {tab === "Team" && <Users size={16} />}
            {tab}
          </button>
        ))}
      </div>

      {/* PROJECTS */}
      {activeTab === "Projects" && (
        <div className="workspace-section">
          <div className="workspace-section-heading">
            <div>
              <h2>Your projects</h2>
              <p>Create and manage your projects.</p>
            </div>

            <label >
              <input
                value={search}
                className="workspace-search"  
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search projects..."
                aria-label="Search projects"
              />
            </label>
          </div>

          {filteredProjects.length === 0 ? (
            <div className="workspace-empty">

              <h3>
                {search.trim() ? "No projects found" : "No projects yet"}
              </h3>

              <p>
                {search.trim()
                  ? "Try another search term."
                  : "Create your first project to get started."}
              </p>

              {!search.trim() && (
                <button
                  type="button"
                  className="workspace-primary-btn"
                  onClick={() => setShowProjectForm(true)}
                >
                  <Plus size={18} />
                  Create Project
                </button>
              )}
            </div>
          ) : (
            <div className="workspace-project-grid">
              {filteredProjects.map((project) => (
                <article
                  className="workspace-project-card"
                  key={project.id}
                >
                  <div className="workspace-project-top">
                    <div
                      className={`workspace-project-icon ${project.color}`}
                    >
                      <FolderKanban size={22} />
                    </div>

                    <button
                      type="button"
                      className="workspace-more-btn"
                      aria-label={`Delete ${project.name}`}
                      title="Delete project"
                      onClick={() => deleteProject(project.id)}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  <h3>{project.name}</h3>

                  <p className="workspace-project-description">
                    {project.description}
                  </p>

                  <div className="workspace-progress-label">
                    <span>Progress</span>
                    <strong>{project.progress}%</strong>
                  </div>

                  <div
                    className="workspace-progress-track"
                    role="progressbar"
                    aria-valuenow={project.progress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${project.name} progress`}
                  >
                    <div
                      className={project.color}
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>

                  <label className="workspace-progress-control">
                    <span>Update progress</span>
                    <select
                      value={project.progress}
                      onChange={(event) =>
                        updateProgress(
                          project.id,
                          Number(event.target.value)
                        )
                      }
                    >
                      <option value={0}>0% — Not started</option>
                      <option value={25}>25% — Started</option>
                      <option value={50}>50% — In progress</option>
                      <option value={75}>75% — Nearly done</option>
                      <option value={100}>100% — Completed</option>
                    </select>
                  </label>

                  <div className="workspace-project-footer">
                    <div className="workspace-avatar-stack">
                      {project.members.map((member, index) => (
                        <span
                          className={`workspace-avatar avatar-${index % 4}`}
                          key={`${project.id}-${member}`}
                        >
                          {member}
                        </span>
                      ))}
                    </div>

                    <span>
                      {project.members.length}{" "}
                      {project.members.length === 1 ? "member" : "members"}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TASK BOARD */}
      {activeTab === "Board" && (
        <div className="workspace-section">
          <div className="workspace-section-heading">
            <div>
              <h2>Task board</h2>
              <p>Create tasks and update their status.</p>
            </div>

            <button
              type="button"
              className="workspace-primary-btn"
              onClick={() => setShowTaskForm(true)}
            >
              <Plus size={17} />
              Add Task
            </button>
          </div>

          <div className="workspace-board">
            {(["To Do", "In Progress", "Done"] as const).map((status) => {
              const statusTasks = boardTasks.filter(
                (task) => task.status === status
              );

              return (
                <div className="workspace-board-column" key={status}>
                  <div className="workspace-board-column-heading">
                    <span
                      className={`workspace-column-dot ${status
                        .toLowerCase()
                        .replace(" ", "-")}`}
                    />
                    <h3>{status}</h3>
                    <span className="workspace-task-count">
                      {statusTasks.length}
                    </span>
                  </div>

                  {statusTasks.map((task) => (
                    <article
                      className="workspace-board-card"
                      key={task.id}
                    >
                      <div className="workspace-project-top">
                        <span
                          className={`workspace-priority ${task.priority.toLowerCase()}`}
                        >
                          {task.priority} priority
                        </span>

                        <button
                          type="button"
                          className="workspace-more-btn"
                          title="Delete task"
                          aria-label={`Delete ${task.title}`}
                          onClick={() => deleteTask(task.id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <h4>{task.title}</h4>
                      <p>{task.project}</p>

                      <label>
                        <span>Move task</span>
                        <select
                          value={task.status}
                          onChange={(event) =>
                            moveTask(
                              task.id,
                              event.target.value as TaskStatus
                            )
                          }
                        >
                          <option value="To Do">To Do</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Done">Done</option>
                        </select>
                      </label>
                    </article>
                  ))}

                  {statusTasks.length === 0 && (
                    <p className="workspace-column-empty">
                      No tasks here yet.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* NOTES */}
      {activeTab === "Notes" && (
        <div className="workspace-section">
          <div className="workspace-section-heading">
            <div>
              <h2>Your notes</h2>
              <p>Save important discussions and ideas.</p>
            </div>

            <button
              type="button"
              className="workspace-secondary-btn"
              onClick={() => setShowNoteForm(true)}
            >
              <Plus size={17} />
              Add Note
            </button>
          </div>

          {notes.length === 0 ? (
            <div className="workspace-empty">
              <FileText size={32} />
              <h3>No notes yet</h3>
              <p>Create your first note to keep important information.</p>

              <button
                type="button"
                className="workspace-primary-btn"
                onClick={() => setShowNoteForm(true)}
              >
                <Plus size={18} />
                Create Note
              </button>
            </div>
          ) : (
            <div className="workspace-notes-grid">
              {notes.map((note) => (
                <article
                  className="workspace-note-card"
                  key={note.id}
                >
                  <div className="workspace-project-top">
                    <div className="workspace-note-icon">
                      <FileText size={20} />
                    </div>

                    <button
                      type="button"
                      className="workspace-more-btn"
                      title="Delete note"
                      aria-label={`Delete ${note.title}`}
                      onClick={() => deleteNote(note.id)}
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>

                  <h3>{note.title}</h3>
                  <p>{note.text}</p>

                  <div className="workspace-note-footer">
                    <span>By {note.author}</span>
                    <span>{note.date}</span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TEAM */}
      {activeTab === "Team" && (
        <div className="workspace-section">
          <div className="workspace-section-heading">
            <div>
              <h2>Project members</h2>
              <p>Members currently associated with your projects.</p>
            </div>
          </div>

          {teamMembers.length === 0 ? (
            <div className="workspace-empty">
              <Users size={32} />
              <h3>No team members yet</h3>
              <p>Create a project to start your workspace.</p>
            </div>
          ) : (
            <div className="workspace-team-grid">
              {teamMembers.map((member, index) => (
                <article
                  className="workspace-member-card"
                  key={member}
                >
                  <div
                    className={`workspace-member-avatar ${
                      ["purple", "blue", "green", "orange"][index % 4]
                    }`}
                  >
                    {member}
                  </div>

                  <h3>{member === userInitials ? userName : member}</h3>
                  <p>Workspace member</p>

                  <span className="workspace-member-label">
                    Project member
                  </span>
                </article>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CREATE PROJECT MODAL */}
      {showProjectForm && (
        <div
          className="workspace-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeAllForms();
            }
          }}
        >
          <form className="workspace-form" onSubmit={addProject}>
            <div className="workspace-form-heading">
              <div>
                <span>PROJECT MANAGEMENT</span>
                <h2>Create a project</h2>
              </div>

              <button
                type="button"
                className="workspace-close-btn"
                onClick={closeAllForms}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <label htmlFor="workspace-project-name">Project name</label>
            <input
              id="workspace-project-name"
              value={projectName}
              onChange={(event) => setProjectName(event.target.value)}
              placeholder="e.g. Mobile application"
              maxLength={80}
              required
              autoFocus
            />

            <label htmlFor="workspace-project-description">
              Description
            </label>
            <textarea
              id="workspace-project-description"
              value={projectDescription}
              onChange={(event) =>
                setProjectDescription(event.target.value)
              }
              placeholder="What is this project about?"
              maxLength={240}
              rows={3}
              required
            />

            <button type="submit" className="workspace-primary-btn">
              <Plus size={18} />
              Create Project
            </button>

            <p className="workspace-demo-note">
              Project data is saved in this browser.
            </p>
          </form>
        </div>
      )}

      {showTaskForm && (
        <div
          className="workspace-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeAllForms();
            }
          }}
        >
          <form className="workspace-form" onSubmit={addTask}>
            <div className="workspace-form-heading">
              <div>
                <span>TASK MANAGEMENT</span>
                <h2>Create a task</h2>
              </div>

              <button
                type="button"
                className="workspace-close-btn"
                onClick={closeAllForms}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <label htmlFor="workspace-task-title">Task title</label>
            <input
              id="workspace-task-title"
              value={taskTitle}
              onChange={(event) => setTaskTitle(event.target.value)}
              placeholder="e.g. Build dashboard"
              maxLength={120}
              required
            />

            <label htmlFor="workspace-task-project">Project</label>
            <select
              id="workspace-task-project"
              value={taskProject}
              onChange={(event) => setTaskProject(event.target.value)}
              required
            >
              <option value="">Select a project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.name}>
                  {project.name}
                </option>
              ))}
            </select>

            <label htmlFor="workspace-task-priority">Priority</label>
            <select
              id="workspace-task-priority"
              value={taskPriority}
              onChange={(event) =>
                setTaskPriority(event.target.value as TaskPriority)
              }
            >
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>

            <button
              type="submit"
              className="workspace-primary-btn"
              disabled={projects.length === 0}
            >
              <Plus size={18} />
              Create Task
            </button>

            {projects.length === 0 && (
              <p className="workspace-demo-note">
                Task create 
              </p>
            )}
          </form>
        </div>
      )}

      {/* CREATE NOTE MODAL */}
      {showNoteForm && (
        <div
          className="workspace-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeAllForms();
            }
          }}
        >
          <form className="workspace-form" onSubmit={addNote}>
            <div className="workspace-form-heading">
              <div>
                <span>TEAM COLLABORATION</span>
                <h2>Create a note</h2>
              </div>

              <button
                type="button"
                className="workspace-close-btn"
                onClick={closeAllForms}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <label htmlFor="workspace-note-title">Note title</label>
            <input
              id="workspace-note-title"
              value={noteTitle}
              onChange={(event) => setNoteTitle(event.target.value)}
              placeholder="e.g. Sprint meeting notes"
              maxLength={100}
              required
            />

            <label htmlFor="workspace-note-text">Note content</label>
            <textarea
              id="workspace-note-text"
              value={noteText}
              onChange={(event) => setNoteText(event.target.value)}
              placeholder="Write your notes here..."
              maxLength={2000}
              rows={5}
              required
            />

            <button type="submit" className="workspace-primary-btn">
              <Plus size={18} />
              Save Note
            </button>

            <p className="workspace-demo-note">
              Notes are saved in this browser.
            </p>
          </form>
        </div>
      )}
    </section>
  );
}
