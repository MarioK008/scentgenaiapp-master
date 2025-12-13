import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Collections from "./pages/Collections";
import Recommendations from "./pages/Recommendations";
import Search from "./pages/Search";
import Admin from "./pages/Admin";
import AdminWaitlist from "./pages/AdminWaitlist";
import AdminEmailLogs from "./pages/AdminEmailLogs";
import EmailTemplates from "./pages/EmailTemplates";
import ImportLogs from "./pages/ImportLogs";
import VoiceAssistant from "./pages/VoiceAssistant";
import VoiceLive from "./pages/VoiceLive";
import VoiceChat from "./pages/VoiceChat";
import VoiceHistory from "./pages/VoiceHistory";
import KnowledgeManagement from "./pages/KnowledgeManagement";
import AdminKnowledge from "./pages/AdminKnowledge";
import AdminUsers from "./pages/AdminUsers";
import Profile from "./pages/Profile";
import PublicProfile from "./pages/PublicProfile";
import Feed from "./pages/Feed";
import NotFound from "./pages/NotFound";
import { AdminRoute } from "./components/AdminRoute";
import { ProtectedRoute } from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          
          {/* Protected User Routes */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/collections" element={<ProtectedRoute><Collections /></ProtectedRoute>} />
          <Route path="/recommendations" element={<ProtectedRoute><Recommendations /></ProtectedRoute>} />
          <Route path="/voice-assistant" element={<ProtectedRoute><VoiceAssistant /></ProtectedRoute>} />
          <Route path="/voice-live" element={<ProtectedRoute><VoiceLive /></ProtectedRoute>} />
          <Route path="/voice-chat" element={<ProtectedRoute><VoiceChat /></ProtectedRoute>} />
          <Route path="/voice-history" element={<ProtectedRoute><VoiceHistory /></ProtectedRoute>} />
          <Route path="/knowledge" element={<ProtectedRoute><KnowledgeManagement /></ProtectedRoute>} />
          <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/user/:userId" element={<ProtectedRoute><PublicProfile /></ProtectedRoute>} />
          <Route path="/feed" element={<ProtectedRoute><Feed /></ProtectedRoute>} />
          
          {/* Admin Only Routes */}
          <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
          <Route path="/admin/waitlist" element={<AdminRoute><AdminWaitlist /></AdminRoute>} />
          <Route path="/admin/email-templates" element={<AdminRoute><EmailTemplates /></AdminRoute>} />
          <Route path="/admin/email-logs" element={<AdminRoute><AdminEmailLogs /></AdminRoute>} />
          <Route path="/admin/import-logs" element={<AdminRoute><ImportLogs /></AdminRoute>} />
          <Route path="/admin/knowledge" element={<AdminRoute><AdminKnowledge /></AdminRoute>} />
          <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
          
          {/* Catch-all Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
