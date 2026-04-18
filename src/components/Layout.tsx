import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/UserAvatar";
import { Logo } from "@/components/Logo";
import { Sparkles, Home, Heart, Search, Shield, LogOut, MessageSquare, User, Users, TrendingUp } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { user, isAdmin, signOut } = useAuth();
  const { profile } = useProfile();
  const location = useLocation();
  const navigate = useNavigate();

  // Separate navigation for admin vs regular users
  const userNavItems = [
    { path: "/dashboard", label: "Dashboard", icon: Home },
    { path: "/collections", label: "Collections", icon: Heart },
    { path: "/recommendations", label: "Recommendations", icon: Sparkles },
    { path: "/voice-assistant", label: "MyScentGenAI", icon: MessageSquare },
    { path: "/trends", label: "Trends", icon: TrendingUp },
    { path: "/search", label: "Search", icon: Search },
  ];

  const adminNavItems = [
    { path: "/admin", label: "Perfumes", icon: Shield },
    { path: "/admin/waitlist", label: "Waitlist", icon: Users },
    { path: "/admin/email-templates", label: "Email Templates", icon: MessageSquare },
    { path: "/admin/knowledge", label: "Knowledge", icon: Sparkles },
    { path: "/admin/users", label: "Users", icon: User },
  ];

  const navItems = isAdmin ? adminNavItems : userNavItems;

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

            {/* Navigation Items - Desktop only */}
            <TooltipProvider delayDuration={200}>
              <div className="hidden md:flex items-center gap-1.5 sm:gap-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Tooltip key={item.path}>
                      <TooltipTrigger asChild>
                        <Link to={item.path}>
                          <Button
                            variant={isActive ? "premium" : "ghost"}
                            size="icon"
                            className={`transition-smooth ${
                              !isActive && "hover:text-accent hover:shadow-gold"
                            }`}
                          >
                            <Icon className="h-5 w-5" strokeWidth={1.5} />
                          </Button>
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p>{item.label}</p>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}

                {/* Separator */}
                <Separator orientation="vertical" className="h-6 mx-1 bg-border/40" />

                {/* Avatar with Profile Access */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => navigate('/profile')}
                      className="hover:shadow-gold transition-smooth rounded-full"
                    >
                      <UserAvatar
                        avatarUrl={profile?.avatar_url}
                        username={profile?.username || user?.email || ""}
                        size="sm"
                      />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>My Profile</p>
                  </TooltipContent>
                </Tooltip>
                
                {/* Sign Out */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={signOut} 
                      className="hover:text-destructive transition-smooth"
                    >
                      <LogOut className="h-5 w-5" strokeWidth={1.5} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Sign Out</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>
          </div>
        </div>
      </nav>

      <main className={`container mx-auto px-6 lg:px-8 py-12 ${!isAdmin ? "pb-20 md:pb-12" : ""}`}>
        {children}
      </main>

      {/* Mobile bottom tab bar - users only */}
      {!isAdmin && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border/30 gradient-card backdrop-blur-xl shadow-elegant">
          <div className="flex items-center justify-around px-2 py-2">
            {userNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className="flex flex-col items-center justify-center gap-1 flex-1 py-1.5 transition-smooth"
                >
                  <Icon
                    className={`h-5 w-5 ${isActive ? "text-accent" : "text-muted-foreground"}`}
                    strokeWidth={1.5}
                  />
                  <span
                    className={`text-xs ${
                      isActive
                        ? "bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent font-semibold"
                        : "text-muted-foreground"
                    }`}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
};

export default Layout;
