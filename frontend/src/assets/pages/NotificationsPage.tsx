
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bell,
  CalendarDays,
  Check,
  CheckCheck,
  Clock3,
  MessageSquare,
  Sparkles,
  Trash2,
  Users,
  Video,
  Filter,
  CheckCircle2,
} from "lucide-react";
import SectionHeading from "../components/SectionHeading";
import "./NotificationsPage.css";

type NotificationType =
  | "meeting"
  | "message"
  | "task"
  | "ai"
  | "workspace";

type NotificationItem = {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  time: string;
  createdAt: number;
  unread: boolean;
  sourceId?: string;
  sourceKey?: string;
};

type Meeting = {
  id: string | number;
  title?: string;
  date?: string;
  time?: string;
  duration?: number | string;
  participants?: string[] | number;
  host?: string;
  status?: string;
};

type Task = {
  id: string | number;
  title?: string;
  project?: string;
  dueDate?: string;
  priority?: string;
  completed?: boolean;
  status?: string;
};

type WorkspaceTask = {
  id: string | number;
  title?: string;
  project?: string;
  dueDate?: string;
  priority?: string;
  status?: string;
  completed?: boolean;
};

const NOTIFICATIONS_KEY = "intellmeet_notifications";
const MEETINGS_KEY = "intellmeet_meetings";
const TASKS_KEY = "intellmeet_tasks";
const WORKSPACE_TASKS_KEY = "intellmeet_workspace_board_tasks";

const filters = [
  "All",
  "Unread",
  "Meetings",
  "Messages",
  "Tasks",
  "AI",
];

function readArray<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function getIcon(type: NotificationType) {
  switch (type) {
    case "meeting":
      return <Video size={20} />;
    case "message":
      return <MessageSquare size={20} />;
    case "task":
      return <CheckCircle2 size={20} />;
    case "ai":
      return <Sparkles size={20} />;
    case "workspace":
      return <Users size={20} />;
  }
}

function getFilterType(filter: string): NotificationType | null {
  switch (filter) {
    case "Meetings":
      return "meeting";
    case "Messages":
      return "message";
    case "Tasks":
      return "task";
    case "AI":
      return "ai";
    default:
      return null;
  }
}

function formatDate(date?: string) {
  if (!date) return "Date not set";

  const parsed = new Date(
    /^\d{4}-\d{2}-\d{2}$/.test(date) ? `${date}T12:00:00` : date
  );

  if (Number.isNaN(parsed.getTime())) return date;

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function relativeTime(timestamp: number) {
  const elapsed = Math.max(0, Date.now() - timestamp);
  const minutes = Math.floor(elapsed / 60000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;

  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;

  return new Date(timestamp).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getGroup(timestamp: number): "Today" | "Yesterday" | "Earlier" {
  const now = new Date();
  const date = new Date(timestamp);

  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date >= today) return "Today";
  if (date >= yesterday) return "Yesterday";
  return "Earlier";
}

function normalizeNotification(
  item: Partial<NotificationItem>
): NotificationItem | null {
  if (!item.id || !item.title) return null;

  const createdAt =
    typeof item.createdAt === "number" ? item.createdAt : Date.now();

  return {
    id: String(item.id),
    type: item.type ?? "workspace",
    title: item.title,
    description: item.description ?? "",
    time: relativeTime(createdAt),
    createdAt,
    unread: item.unread === true,
    sourceId: item.sourceId,
    sourceKey: item.sourceKey,
  };
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>(
    () =>
      readArray<Partial<NotificationItem>>(NOTIFICATIONS_KEY)
        .map(normalizeNotification)
        .filter((item): item is NotificationItem => item !== null)
  );

  const [activeFilter, setActiveFilter] = useState("All");
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  const saveNotifications = useCallback(
    (updated: NotificationItem[]) => {
      setNotifications(updated);

      try {
        localStorage.setItem(
          NOTIFICATIONS_KEY,
          JSON.stringify(updated)
        );
        window.dispatchEvent(
          new Event("intellmeet_notifications_updated")
        );
      } catch (error) {
        console.error("Unable to save notifications:", error);
      }
    },
    []
  );

  // Generate notifications from saved meetings and tasks.
  // A source key prevents the same event being added repeatedly.
  const syncNotifications = useCallback(() => {
    const meetings = readArray<Meeting>(MEETINGS_KEY);
    const tasks = readArray<Task>(TASKS_KEY);
    const workspaceTasks = readArray<WorkspaceTask>(WORKSPACE_TASKS_KEY);

    const saved = readArray<Partial<NotificationItem>>(
      NOTIFICATIONS_KEY
    )
      .map(normalizeNotification)
      .filter((item): item is NotificationItem => item !== null);

    const existingKeys = new Set(
      saved.map((item) => item.sourceKey).filter(Boolean)
    );

    const generated: NotificationItem[] = [];

    meetings.forEach((meeting) => {
      if (meeting.id == null || !meeting.title) return;

      const status = (meeting.status ?? "").toLowerCase();
      const eventType = status.includes("complete")
        ? "completed"
        : "scheduled";

      const sourceKey = `meeting:${meeting.id}:${eventType}`;

      if (existingKeys.has(sourceKey)) return;

      generated.push({
        id: sourceKey,
        type: "meeting",
        title:
          eventType === "completed"
            ? "Meeting completed"
            : "Meeting scheduled",
        description:
          eventType === "completed"
            ? `"${meeting.title}" is marked as completed.`
            : `"${meeting.title}" is scheduled for ${formatDate(
                meeting.date
              )}${meeting.time ? ` at ${meeting.time}` : ""}.`,
        time: "Just now",
        createdAt: Date.now(),
        unread: true,
        sourceId: String(meeting.id),
        sourceKey,
      });

      existingKeys.add(sourceKey);
    });

    const allTasks = [
      ...tasks.map((task) => ({ ...task, origin: "task" })),
      ...workspaceTasks.map((task) => ({
        ...task,
        origin: "workspace",
      })),
    ];

    allTasks.forEach((task) => {
      if (task.id == null || !task.title) return;

      const sourceKey = `${task.origin}:${task.id}:created`;

      if (existingKeys.has(sourceKey)) return;

      generated.push({
        id: sourceKey,
        type: "task",
        title: "Task available",
        description: `"${task.title}"${
          task.project ? ` in ${task.project}` : ""
        }${task.dueDate ? ` is due ${formatDate(task.dueDate)}` : ""}.`,
        time: "Just now",
        createdAt: Date.now(),
        unread: true,
        sourceId: String(task.id),
        sourceKey,
      });

      existingKeys.add(sourceKey);

      const isCompleted =
        task.completed === true ||
        task.status?.toLowerCase() === "done" ||
        task.status?.toLowerCase() === "completed";

      const completionKey = `${task.origin}:${task.id}:completed`;

      if (isCompleted && !existingKeys.has(completionKey)) {
        generated.push({
          id: completionKey,
          type: "task",
          title: "Task completed",
          description: `"${task.title}" has been marked as completed.`,
          time: "Just now",
          createdAt: Date.now(),
          unread: true,
          sourceId: String(task.id),
          sourceKey: completionKey,
        });

        existingKeys.add(completionKey);
      }
    });

    if (generated.length > 0) {
      const merged = [...generated, ...saved].slice(0, 200);

      try {
        localStorage.setItem(
          NOTIFICATIONS_KEY,
          JSON.stringify(merged)
        );
        setNotifications(merged);
      } catch (error) {
        console.error("Unable to sync notifications:", error);
      }
    } else {
      setNotifications(saved);
    }
  }, []);

  useEffect(() => {
    syncNotifications();

    const handleUpdate = () => syncNotifications();

    window.addEventListener("storage", handleUpdate);
    window.addEventListener("intellmeet_meetings_updated", handleUpdate);
    window.addEventListener("intellmeet_tasks_updated", handleUpdate);
    window.addEventListener(
      "intellmeet_workspace_tasks_updated",
      handleUpdate
    );

    return () => {
      window.removeEventListener("storage", handleUpdate);
      window.removeEventListener(
        "intellmeet_meetings_updated",
        handleUpdate
      );
      window.removeEventListener(
        "intellmeet_tasks_updated",
        handleUpdate
      );
      window.removeEventListener(
        "intellmeet_workspace_tasks_updated",
        handleUpdate
      );
    };
  }, [syncNotifications]);

  const unreadCount = notifications.filter((item) => item.unread).length;

  const visibleNotifications = useMemo(() => {
    return notifications.filter((item) => {
      const filterType = getFilterType(activeFilter);

      const matchesFilter =
        activeFilter === "All" ||
        activeFilter === "Unread" ||
        item.type === filterType;

      const matchesUnread =
        !(showUnreadOnly || activeFilter === "Unread") || item.unread;

      return matchesFilter && matchesUnread;
    });
  }, [notifications, activeFilter, showUnreadOnly]);

  const markAsRead = (id: string) => {
    saveNotifications(
      notifications.map((item) =>
        item.id === id ? { ...item, unread: false } : item
      )
    );
  };

  const markAllAsRead = () => {
    saveNotifications(
      notifications.map((item) => ({ ...item, unread: false }))
    );
  };

  const deleteNotification = (id: string) => {
    saveNotifications(notifications.filter((item) => item.id !== id));
  };

  const clearAll = () => saveNotifications([]);

  const groupedNotifications = (
    ["Today", "Yesterday", "Earlier"] as const
  ).map((group) => ({
    group,
    items: visibleNotifications.filter(
      (item) => getGroup(item.createdAt) === group
    ),
  }));

  return (
    <div className="notifications-page">
      <SectionHeading
        eyebrow="YOUR UPDATES"
        title="Notifications"
        subtitle="Stay updated with saved meetings and tasks."
      />

      <section className="notification-overview">
        <div className="notification-overview-icon">
          <Bell size={25} />
        </div>

        <div className="notification-overview-copy">
          <h3>
            {unreadCount > 0 ? "You have " : "You're all caught up with "}
            <span>{unreadCount} unread</span>
          </h3>
          <p>
            {unreadCount > 0
              ? "Review your latest meeting and task updates."
              : "You have no unread notifications."}
          </p>
        </div>

        <div className="notification-overview-actions">
          <button
            className="notification-button notification-button-primary"
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
          >
            <CheckCheck size={16} />
            Mark all read
          </button>
        </div>
      </section>

      <section className="notification-content">
        <div className="notification-toolbar">
          <div className="notification-filter-list">
            {filters.map((filter) => (
              <button
                key={filter}
                className={`notification-filter ${
                  activeFilter === filter ? "active" : ""
                }`}
                onClick={() => setActiveFilter(filter)}
              >
                {filter}
                {filter === "Unread" && unreadCount > 0 && (
                  <span className="filter-count">{unreadCount}</span>
                )}
              </button>
            ))}
          </div>

          <div className="notification-toolbar-actions">
            <button
              className={`notification-icon-button ${
                showUnreadOnly ? "selected" : ""
              }`}
              onClick={() => setShowUnreadOnly((value) => !value)}
              title="Toggle unread only"
              aria-label="Toggle unread only"
            >
              <Filter size={17} />
            </button>

            <button
              className="notification-clear-button"
              onClick={clearAll}
              disabled={notifications.length === 0}
            >
              <Trash2 size={16} />
              Clear all
            </button>
          </div>
        </div>

        <div className="notification-list">
          {groupedNotifications.map(
            ({ group, items }) =>
              items.length > 0 && (
                <div className="notification-group" key={group}>
                  <div className="notification-group-heading">
                    <span>{group}</span>
                    <span className="notification-group-line" />
                  </div>

                  {items.map((item) => (
                    <article
                      className={`notification-item ${
                        item.unread ? "is-unread" : ""
                      }`}
                      key={item.id}
                    >
                      <div
                        className={`notification-item-icon type-${item.type}`}
                      >
                        {getIcon(item.type)}
                      </div>

                      <div className="notification-item-content">
                        <div className="notification-item-title-row">
                          <h3>{item.title}</h3>
                          {item.unread && (
                            <span className="notification-unread-dot" />
                          )}
                        </div>

                        <p>{item.description}</p>

                        <div className="notification-item-time">
                          <Clock3 size={13} />
                          <span>{relativeTime(item.createdAt)}</span>
                        </div>
                      </div>

                      <div className="notification-item-actions">
                        {item.unread && (
                          <button
                            className="notification-action"
                            onClick={() => markAsRead(item.id)}
                            title="Mark as read"
                            aria-label={`Mark ${item.title} as read`}
                          >
                            <Check size={17} />
                          </button>
                        )}

                        <button
                          className="notification-action delete"
                          onClick={() => deleteNotification(item.id)}
                          title="Delete notification"
                          aria-label={`Delete ${item.title}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )
          )}

          {visibleNotifications.length === 0 && (
            <div className="notification-empty">
              <div className="notification-empty-icon">
                <CalendarDays size={28} />
              </div>
              <h3>No notifications found</h3>
              <p>
                New saved meetings and tasks will appear here when
                the page detects them.
              </p>
              <button
                className="notification-button notification-button-primary"
                onClick={() => {
                  setActiveFilter("All");
                  setShowUnreadOnly(false);
                }}
              >
                View all notifications
              </button>
            </div>
          )}
        </div>

        <div className="notification-footer">
          Showing {visibleNotifications.length} of {notifications.length}{" "}
          notifications
        </div>
      </section>
    </div>
  );
}
