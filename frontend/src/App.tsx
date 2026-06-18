import { Routes, Route } from "react-router";
import { Toaster } from "@/components/ui/sonner";
import MainLayout from "@/components/layout/MainLayout";
import Dashboard from "@/pages/Dashboard";
import Quests from "@/pages/Quests";
import WeeklyPlanning from "@/pages/WeeklyPlanning";
import FocusMode from "@/pages/FocusMode";
import BossFight from "@/pages/BossFight";
import DoraemonChat from "@/pages/DoraemonChat";
import Settings from "@/pages/Settings";

function App() {
  return (
    <>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/quests" element={<Quests />} />
          <Route path="/planning" element={<WeeklyPlanning />} />
          <Route path="/focus" element={<FocusMode />} />
          <Route path="/boss-fight" element={<BossFight />} />
          <Route path="/chat" element={<DoraemonChat />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
      <Toaster position="top-right" />
    </>
  );
}

export default App;
