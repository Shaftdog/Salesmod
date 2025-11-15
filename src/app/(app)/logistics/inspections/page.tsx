import { PlaceholderPage } from "@/components/ui/placeholder-page";
import { MapPinned } from "lucide-react";

export default function InspectionsPage() {
  return (
    <PlaceholderPage
      title="Inspection Management"
      description="Track inspection progress and completion status"
      backLink="/logistics"
      backLinkLabel="Back to Logistics"
      icon={MapPinned}
    />
  );
}
