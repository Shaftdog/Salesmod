import { PlaceholderPage } from "@/components/ui/placeholder-page";
import { UserCog } from "lucide-react";

export default function ResourcesPage() {
  return (
    <PlaceholderPage
      title="Resource Management"
      description="Manage team members, assignments, and resource allocation"
      backLink="/operations"
      backLinkLabel="Back to Operations"
      icon={UserCog}
    />
  );
}
