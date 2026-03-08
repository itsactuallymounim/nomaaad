import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { MapPinOff } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-primary/10 flex items-center justify-center shadow-xl">
          <MapPinOff className="h-12 w-12 text-primary" />
        </div>
        <h1 className="mb-2 text-5xl font-bold text-foreground">404</h1>
        <p className="mb-6 text-lg text-muted-foreground">Oops! This page wandered off</p>
        <a href="/" className="inline-flex items-center px-6 py-3 rounded-full bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity">
          Return Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
