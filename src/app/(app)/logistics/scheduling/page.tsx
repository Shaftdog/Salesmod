import { PlaceholderPage } from "@/components/ui/placeholder-page";
import { CalendarClock } from "lucide-react";

export default function SchedulingPage() {
  return (
    <PlaceholderPage
      title="Inspection Scheduling"
      description="Schedule and coordinate property inspections"
      backLink="/logistics"
      backLinkLabel="Back to Logistics"
      icon={CalendarClock}
    />
  );
}
