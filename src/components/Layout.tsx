import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/UserAvatar";
import { Logo } from "@/components/Logo";
import { Sparkles, Home, Heart, Search, Shield, LogOut, MessageSquare, User, Users } from "lucide-react";

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
    { path: "/feed", label: "Feed", icon: Users },
    { path: "/recommendations", label: "Recommendations", icon: Sparkles },
    { path: "/voice-assistant", label: "MyScentGenAI", icon: MessageSquare },
    { path: "/search", label: "Search", icon: Search },
  ];

  if (isAdmin) {
    navItems.push(
      { path: "/admin", label: "Perfumes", icon: Shield },
      { path: "/admin/waitlist", label: "Waitlist", icon: Shield }
    );
  }

  return (
    <div className="min-h-screen gradient-subtle">
      <nav className="border-b border-border/30 gradient-card backdrop-blur-xl shadow-elegant sticky top-0 z-50">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link 
              to="/dashboard" 
              className="group transition-smooth hover:opacity-80"
            >
              <Logo variant="full" className="hidden sm:flex" />
              <Logo variant="compact" className="flex sm:hidden" />
            </Link>

            {/* Navigation Items */}
            <div className="flex items-center gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link key={item.path} to={item.path}>
                    <Button
                      variant={isActive ? "premium" : "ghost"}
                      size="sm"
                      className={`gap-2 transition-smooth ${
                        !isActive && "hover:text-accent hover:shadow-gold"
                      }`}
                    >
                      <Icon className="h-4 w-4" strokeWidth={1.5} />
                      <span className="hidden lg:inline">{item.label}</span>
                    </Button>
                  </Link>
                );
              })}

              {/* Avatar with Profile Access */}
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => navigate('/profile')}
                className="ml-4 hover:shadow-gold transition-smooth rounded-full"
                title="My Profile"
              >
                <UserAvatar
                  avatarUrl={profile?.avatar_url}
                  username={profile?.username || user?.email || ""}
                  size="sm"
                />
              </Button>
              
              {/* Sign Out */}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={signOut} 
                className="gap-2 ml-2 hover:text-destructive transition-smooth"
              >
                <LogOut className="h-4 w-4" strokeWidth={1.5} />
                <span className="hidden md:inline">Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-6 lg:px-8 py-12">
        {children}
      </main>
    </div>
  );
};

export default Layout;
