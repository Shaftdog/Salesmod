import { PlaceholderPage } from "@/components/ui/placeholder-page";
import { Target } from "lucide-react";

export default function WorkflowsPage() {
  return (
    <PlaceholderPage
      title="Workflow Automation"
      description="Create and manage automated business process workflows"
      backLink="/operations"
      backLinkLabel="Back to Operations"
      icon={Target}
    />
  );
}
