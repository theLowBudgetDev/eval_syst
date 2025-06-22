
"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { ComingSoon } from "@/components/shared/ComingSoon";

export default function MyNotificationsPage() {
  return (
    <>
      <PageHeader
        title="All Notifications"
        description="View your complete notification history."
      />
      <ComingSoon featureName="Full Notification History" />
    </>
  );
}
