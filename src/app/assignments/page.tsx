import { PageHeader } from "@/components/shared/PageHeader";
import { ComingSoon } from "@/components/shared/ComingSoon";

export default function SupervisorAssignmentsPage() {
  return (
    <div>
      <PageHeader 
        title="Supervisor Assignments"
        description="Assign supervisors to employees."
      />
      <ComingSoon featureName="Supervisor Assignments" />
    </div>
  );
}
