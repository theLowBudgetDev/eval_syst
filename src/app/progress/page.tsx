import { PageHeader } from "@/components/shared/PageHeader";
import { ComingSoon } from "@/components/shared/ComingSoon";

export default function ProgressMonitorPage() {
  return (
    <div>
      <PageHeader 
        title="Progress Monitor"
        description="Monitor employee progress, attendance, and completed work."
      />
      <ComingSoon featureName="Progress Monitor" />
    </div>
  );
}
