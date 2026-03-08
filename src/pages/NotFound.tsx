import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import gorillaCharacter from '@/assets/characters/gorilla-pizza.png';

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <img src={gorillaCharacter} alt="" className="w-36 h-36 mx-auto mb-6 rounded-3xl object-cover shadow-xl" />
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
