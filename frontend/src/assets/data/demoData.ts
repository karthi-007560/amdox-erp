
import type { Meeting } from "../components/MeetingCard";
import type { Task } from "../components/TaskList";

export const demoMeetings: Meeting[] = [
  {
    id: "meeting-1",
    title: "Product Design Review",
    date: "Oct 13, 2026",
    time: "10:00 AM",
    duration: "45 min",
    participants: ["Karthik", "Priya", "Arun", "Meena", "Rahul"],
    category: "Design",
    color: "purple",
    status: "Upcoming",
  },
  {
    id: "meeting-2",
    title: "Sprint Planning",
    date: "Oct 13, 2026",
    time: "11:30 AM",
    duration: "30 min",
    participants: ["Karthik", "Arun", "Priya"],
    category: "Planning",
    color: "blue",
    status: "Upcoming",
  },
  {
    id: "meeting-3",
    title: "Frontend Development Sync",
    date: "Oct 13, 2026",
    time: "02:00 PM",
    duration: "30 min",
    participants: ["Karthik", "Rahul", "Meena"],
    category: "Development",
    color: "green",
    status: "Upcoming",
  },
];

export const demoTasks: Task[] = [
  {
    id: "task-1",
    title: "Complete dashboard UI",
    project: "IntellMeet",
    dueDate: "Oct 13",
    priority: "High",
    completed: false,
  },
  {
    id: "task-2",
    title: "Review meeting components",
    project: "Frontend",
    dueDate: "Oct 14",
    priority: "Medium",
    completed: false,
  },
  {
    id: "task-3",
    title: "Prepare sprint notes",
    project: "Team Workspace",
    dueDate: "Oct 15",
    priority: "Low",
    completed: true,
  },
  {
    id: "task-4",
    title: "Test responsive layouts",
    project: "IntellMeet",
    dueDate: "Oct 16",
    priority: "High",
    completed: false,
  },
];
