import { PlaceholderPage } from "@/components/ui/placeholder-page";
import { UserCog } from "lucide-react";

export default function AssignmentsPage() {
  return (
    <PlaceholderPage
      title="Field Assignments"
      description="Assign inspections and tasks to field team members"
      backLink="/logistics"
      backLinkLabel="Back to Logistics"
      icon={UserCog}
    />
  );
}
