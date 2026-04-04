import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { AgentActivityProvider } from "@/context/AgentActivityProvider";
import AgentsPage from "@/pages/AgentsPage";
import ConversationsPage from "@/pages/ConversationsPage";
import Dashboard from "@/pages/Dashboard";
import EmailMonitorPage from "@/pages/EmailMonitorPage";
import NotFound from "./pages/NotFound.tsx";
import SettingsPage from "@/pages/SettingsPage";
import TasksPage from "@/pages/TasksPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AgentActivityProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<DashboardLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/agents" element={<AgentsPage />} />
              <Route path="/tasks" element={<TasksPage />} />
              <Route path="/conversations" element={<ConversationsPage />} />
              <Route path="/emails" element={<EmailMonitorPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AgentActivityProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
