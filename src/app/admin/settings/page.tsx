import { PageHeader } from "@/components/shared/PageHeader";
import { ComingSoon } from "@/components/shared/ComingSoon";

export default function AdminSettingsPage() {
  return (
    <div>
      <PageHeader 
        title="Admin Settings"
        description="Manage system-wide configurations and perform administrative tasks."
      />
      <ComingSoon featureName="Admin Settings" />
    </div>
  );
}
