
import { Navigate, Route, Routes } from "react-router-dom";

import AppLayout from "./assets/components/AppLayout";
import DashboardPage from "./assets/pages/DashboardPage";
import WorkspacePage from "./assets/pages/WorkspacePage";
import AnalyticsPage from "./assets/pages/AnalyticsPage";
import SettingsPage from "./assets/pages/SettingsPage";
import NotificationsPage from "./assets/pages/NotificationsPage";
import MeetingsPage from "./assets/pages/MeetingsPage";
import TasksPage from "./assets/pages/TasksPage";
import MeetingHistoryPage from "./assets/pages/MeetingHistoryPage";
function App() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<DashboardPage />} />

        <Route path="/meetings" element={<MeetingsPage />} />

        <Route path="/tasks" element={<TasksPage />} />

        <Route path="/workspace" element={<WorkspacePage />} />

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
