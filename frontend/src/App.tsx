
import { Navigate, Route, Routes } from "react-router-dom";

import AppLayout from "../src/assets/components/AppLayout";

import DashboardPage from "../src/assets/pages/DashboardPage";
import WorkspacePage from "../src/assets/pages/WorkspacePage";
import AnalyticsPage from "./assets/pages/AnalyticsPage";
import SettingsPage from "../src/assets/pages/SettingsPage";
import NotificationsPage from "../src/assets/pages/NotificationsPage";
import MeetingsPage from "../src/assets/pages/MeetingsPage";
import TasksPage from "../src/assets/pages/TasksPage";
import MeetingHistoryPage from "../src/assets/pages/MeetingHistoryPage";
import TeamPage from "./assets/pages/TeamPage";

// Meeting Room
import MeetingRoomPage from "../src/assets/components/MeetingRoom/MeetingRoom";

function App() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<DashboardPage />} />

        <Route path="/meetings" element={<MeetingsPage />} />

        {/* Live Meeting Room */}
        <Route
          path="/meeting/:meetingId"
          element={<MeetingRoomPage />}
        />

        <Route path="/tasks" element={<TasksPage />} />

        <Route path="/workspace" element={<WorkspacePage />} />

        <Route path="/team" element={<TeamPage />} />

        <Route path="/analytics" element={<AnalyticsPage />} />

        <Route path="/settings" element={<SettingsPage />} />

        <Route
          path="/notifications"
          element={<NotificationsPage />}
        />

        <Route
          path="/meeting-history"
          element={<MeetingHistoryPage />}
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
  );
}

export default App;
