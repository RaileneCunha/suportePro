import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sidebar } from "@/components/Sidebar";
import { useAuth } from "@/hooks/use-auth";

// Pages
import Dashboard from "@/pages/Dashboard";
import Tickets from "@/pages/Tickets";
import TicketDetail from "@/pages/TicketDetail";
import KnowledgeBase from "@/pages/KnowledgeBase";
import Reports from "@/pages/Reports";
import Technicians from "@/pages/Technicians";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import NotFound from "@/pages/not-found";
import { useProfile } from "@/hooks/use-profile";
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "https://e1a5b40286702f3196853f5621677801@o4510739831848960.ingest.us.sentry.io/4510739839909888",
  // Setting this option to true will send default PII data to Sentry.
  // For example, automatic IP address collection on events
  sendDefaultPii: true
});

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return <div className="flex items-center justify-center h-screen bg-background">Loading...</div>;
  if (!user) return <Redirect to="/" />;

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-3 lg:p-6 lg:ml-64">
        <Component />
      </main>
    </div>
  );
}

function AdminRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading: userLoading } = useAuth();
  const { profile, isLoading: profileLoading, isAdmin } = useProfile();

  if (userLoading || profileLoading) {
    return <div className="flex items-center justify-center h-screen bg-background">Loading...</div>;
  }
  
  if (!user) return <Redirect to="/" />;
  if (!isAdmin) return <Redirect to="/dashboard" />;

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-3 lg:p-6 lg:ml-64">
        <Component />
      </main>
    </div>
  );
}

function Router() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <div className="flex items-center justify-center h-screen bg-background">Loading...</div>;

  return (
    <Switch>
      <Route path="/">
        {user ? <Redirect to="/dashboard" /> : <Landing />}
      </Route>
      
      <Route path="/login">
        <Login />
      </Route>
      
      <Route path="/dashboard">
        <ProtectedRoute component={Dashboard} />
      </Route>
      
      <Route path="/tickets">
        <ProtectedRoute component={Tickets} />
      </Route>
      
      <Route path="/tickets/:id">
        <ProtectedRoute component={TicketDetail} />
      </Route>
      
      <Route path="/knowledge-base">
        <ProtectedRoute component={KnowledgeBase} />
      </Route>
      
      <Route path="/reports">
        <ProtectedRoute component={Reports} />
      </Route>
      
      <Route path="/technicians">
        <AdminRoute component={Technicians} />
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
