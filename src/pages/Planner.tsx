import { TravelPlanner } from "@/components/TravelPlanner";
import { useTripPersistence } from "@/hooks/useTripPersistence";

const Planner = () => {
  // Initialize trip persistence (auto-loads saved trip)
  useTripPersistence();
  
  return <TravelPlanner />;
};

export default Planner;
