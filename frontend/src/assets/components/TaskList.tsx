
import { useState } from "react";
import "./TaskList.css";

export type Task = {
  id: string;
  title: string;
  project: string;
  dueDate: string;
  priority: "High" | "Medium" | "Low";
  completed: boolean;
};

type TaskListProps = {
  tasks: Task[];
  onTaskChange?: (task: Task) => void;
};

export default function TaskList({
  tasks,
  onTaskChange,
}: TaskListProps) {
  const [localTasks, setLocalTasks] = useState(tasks);

  function toggleTask(taskId: string) {
    setLocalTasks((currentTasks) =>
      currentTasks.map((task) => {
        if (task.id !== taskId) return task;

        const updatedTask = {
          ...task,
          completed: !task.completed,
        };

        onTaskChange?.(updatedTask);
        return updatedTask;
      })
    );
  }

  return (
    <section className="task-list">
      <div className="task-list-header">
        <div>
          <h3>My Tasks</h3>
          <p>Your team's action items</p>
        </div>

        <span className="task-count">
          {localTasks.filter((task) => !task.completed).length} remaining
        </span>
      </div>

      {localTasks.length === 0 ? (
        <div className="task-empty">No tasks available.</div>
      ) : (
        <div className="task-items">
          {localTasks.map((task) => (
            <label
              className={`task-item ${task.completed ? "task-completed" : ""}`}
              key={task.id}
            >
              <input
                type="checkbox"
                checked={task.completed}
                onChange={() => toggleTask(task.id)}
              />

              <span className="task-checkbox" aria-hidden="true">
                {task.completed ? "✓" : ""}
              </span>

              <span className="task-content">
                <span className="task-title">{task.title}</span>
                <span className="task-project">
                  {task.project} · Due {task.dueDate}
                </span>
              </span>

              <span className={`task-priority ${task.priority.toLowerCase()}`}>
                {task.priority}
              </span>
            </label>
          ))}
        </div>
      )}
    </section>
  );
}
