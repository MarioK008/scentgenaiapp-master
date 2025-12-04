import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/UserAvatar";
import { Logo } from "@/components/Logo";
import { cn } from "@/lib/utils";
import {
  Database,
  Users,
  Mail,
  FileText,
  Brain,
  LogOut,
  LayoutDashboard,
  ClipboardList,
  Settings,
  ChevronLeft,
  Home,
} from "lucide-react";

interface AdminLayoutProps {
  children: ReactNode;
}

const adminNavItems = [
  { 
    path: "/admin", 
    label: "Dashboard", 
    icon: LayoutDashboard,
    description: "Overview & CSV Import"
  },
  { 
    path: "/admin/users", 
    label: "Users", 
    icon: Users,
    description: "Manage user accounts"
  },
  { 
    path: "/admin/waitlist", 
    label: "Waitlist", 
    icon: ClipboardList,
    description: "Early access signups"
  },
  { 
    path: "/admin/email-templates", 
    label: "Email Templates", 
    icon: Mail,
    description: "Manage email templates"
  },
  { 
    path: "/admin/email-logs", 
    label: "Email Logs", 
    icon: FileText,
    description: "View sent emails"
  },
  { 
    path: "/admin/knowledge", 
    label: "Knowledge Base", 
    icon: Brain,
    description: "AI knowledge documents"
  },
  { 
    path: "/admin/import-logs", 
    label: "Import Logs", 
    icon: Database,
    description: "CSV import history"
  },
];

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => {
    if (path === "/admin") {
      return location.pathname === "/admin";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card flex flex-col">
        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b border-border">
          <Link to="/admin" className="flex items-center gap-2">
            <Logo variant="compact" />
            <span className="font-semibold text-foreground">Admin</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {adminNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{item.label}</div>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="p-4 border-t border-border space-y-2">
          {/* Back to App */}
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2"
            onClick={() => navigate("/dashboard")}
          >
            <Home className="h-4 w-4" />
            Back to App
          </Button>

          {/* User Info & Sign Out */}
          <div className="flex items-center gap-3 px-2 py-2">
            <UserAvatar
              avatarUrl={profile?.avatar_url}
              username={profile?.username || user?.email || ""}
              size="sm"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {profile?.username || user?.email?.split("@")[0]}
              </p>
              <p className="text-xs text-muted-foreground">Admin</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={signOut}
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
