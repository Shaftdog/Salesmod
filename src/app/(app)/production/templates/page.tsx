import { PlaceholderPage } from "@/components/ui/placeholder-page";
import { FileCheck } from "lucide-react";

export default function TemplatesPage() {
  return (
    <PlaceholderPage
      title="Appraisal Templates"
      description="Manage templates and standards for appraisal production"
      backLink="/production"
      backLinkLabel="Back to Production"
      icon={FileCheck}
    />
  );
}
