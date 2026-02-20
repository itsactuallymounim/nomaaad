import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { TravelPlanner } from "@/components/TravelPlanner";
import { useTripPersistence } from "@/hooks/useTripPersistence";
import { useTravelPlanner } from "@/hooks/useTravelPlanner";

function PlannerInner() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { sendMessage } = useTravelPlanner();

  useEffect(() => {
    const city = searchParams.get("city");
    if (city) {
      // Remove param immediately so it doesn't re-trigger
      setSearchParams({}, { replace: true });
      // Small delay so the planner UI is mounted
      const timer = setTimeout(() => {
        sendMessage(`Plan a trip to ${city}`);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return <TravelPlanner />;
}

const Planner = () => {
  // Initialize trip persistence (auto-loads saved trip)
  useTripPersistence();

  return <PlannerInner />;
};

export default Planner;

