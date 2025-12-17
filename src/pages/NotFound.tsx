import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isSignedIn } = useUser();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="mb-4 text-6xl font-gaming font-bold text-gradient">404</h1>
        <p className="mb-8 text-xl text-muted-foreground font-cyber">Oops! Page not found</p>
        <Button
          variant="neon"
          size="lg"
          onClick={() => navigate(isSignedIn ? "/home" : "/")}
          className="font-gaming"
        >
          Return to {isSignedIn ? "Dashboard" : "Home"}
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
