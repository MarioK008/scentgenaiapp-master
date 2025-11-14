import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/UserAvatar";
import { Sparkles, Home, Heart, Search, Shield, LogOut, MessageSquare, User } from "lucide-react";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { user, isAdmin, signOut } = useAuth();
  const { profile } = useProfile();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: Home },
    { path: "/collection", label: "Collection", icon: Heart },
    { path: "/recommendations", label: "Recommendations", icon: Sparkles },
    { path: "/voice-assistant", label: "MyScentGenAI", icon: MessageSquare },
    { path: "/search", label: "Search", icon: Search },
  ];

  if (isAdmin) {
    navItems.push({ path: "/admin", label: "Admin", icon: Shield });
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/dashboard" className="flex items-center space-x-2">
              <Sparkles className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                ScentGenAI
              </span>
            </Link>

            <div className="flex items-center space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link key={item.path} to={item.path}>
                    <Button
                      variant={isActive ? "default" : "ghost"}
                      size="sm"
                      className="gap-2"
                    >
                      <Icon className="h-4 w-4" />
                      <span className="hidden sm:inline">{item.label}</span>
                    </Button>
                  </Link>
                );
              })}
              
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/profile')} 
                className="gap-2 ml-2"
              >
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">My Account</span>
              </Button>

              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => navigate('/profile')}
                className="ml-2"
              >
                <UserAvatar
                  avatarUrl={profile?.avatar_url}
                  username={profile?.username || user?.email || ""}
                  size="sm"
                />
              </Button>
              
              <Button variant="ghost" size="sm" onClick={signOut} className="gap-2 ml-2">
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;
