import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Collection from "./pages/Collection";
import Recommendations from "./pages/Recommendations";
import Search from "./pages/Search";
import Admin from "./pages/Admin";
import VoiceAssistant from "./pages/VoiceAssistant";
import VoiceLive from "./pages/VoiceLive";
import VoiceChat from "./pages/VoiceChat";
import VoiceHistory from "./pages/VoiceHistory";
import KnowledgeManagement from "./pages/KnowledgeManagement";
import Profile from "./pages/Profile";
import PublicProfile from "./pages/PublicProfile";
import Feed from "./pages/Feed";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/collection" element={<Collection />} />
          <Route path="/recommendations" element={<Recommendations />} />
          <Route path="/voice-assistant" element={<VoiceAssistant />} />
          <Route path="/voice-live" element={<VoiceLive />} />
          <Route path="/voice-chat" element={<VoiceChat />} />
          <Route path="/voice-history" element={<VoiceHistory />} />
          <Route path="/knowledge" element={<KnowledgeManagement />} />
          <Route path="/search" element={<Search />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/user/:userId" element={<PublicProfile />} />
          <Route path="/feed" element={<Feed />} />
          <Route path="/admin" element={<Admin />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
