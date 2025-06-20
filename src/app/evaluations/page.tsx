import { PageHeader } from "@/components/shared/PageHeader";
import { ComingSoon } from "@/components/shared/ComingSoon";

export default function EvaluationsPage() {
  return (
    <div>
      <PageHeader 
        title="Evaluations Management"
        description="Define evaluation criteria and manage performance scores."
      />
      <ComingSoon featureName="Evaluations Management" />
    </div>
  );
}
