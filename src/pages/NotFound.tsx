import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, Search } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen gradient-subtle flex items-center justify-center p-6">
      <div className="text-center max-w-md space-y-8 animate-fade-in">
        {/* Illustrated 404 */}
        <div className="relative inline-block">
          <div className="text-9xl font-playfair font-bold gradient-text opacity-20">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-28 rounded-[12px] border-2 border-primary/50 relative overflow-hidden">
              {/* Empty bottle */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-4 rounded-t-lg border-2 border-primary/50 bg-background" />
              {/* Question mark inside */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl text-primary/50">?</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl font-playfair font-semibold">
            Page Not Found
          </h1>
          <p className="text-muted-foreground leading-relaxed">
            This fragrance seems to have evaporated. Let's help you find your way back to the collection.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild variant="hero" size="lg">
            <Link to="/">
              <Home className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to="/search">
              <Search className="h-4 w-4 mr-2" />
              Search Perfumes
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
