import { PageHeader } from "@/components/shared/PageHeader";
import { ComingSoon } from "@/components/shared/ComingSoon";

export default function AutoMessagingPage() {
  return (
    <div>
      <PageHeader 
        title="Auto Messaging Configuration"
        description="Set up automated messages for platform events."
      />
      <ComingSoon featureName="Auto Messaging Configuration" />
    </div>
  );
}
