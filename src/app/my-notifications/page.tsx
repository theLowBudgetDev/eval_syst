
"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import type { Notification } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { NotificationItem } from "@/components/shared/NotificationItem";
import { BellOff } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function MyNotificationsPage() {
  const { user, isLoading: authIsLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [isLoadingData, setIsLoadingData] = React.useState(true);

  const fetchAllNotifications = React.useCallback(async () => {
    if (!user) return;
    setIsLoadingData(true);
    try {
      const headers = new Headers();
      headers.append('X-User-Id', user.id);
      headers.append('X-User-Role', user.role);

      const res = await fetch('/api/notifications?no_limit=true', { headers });
      if (!res.ok) throw new Error('Failed to fetch notifications');
      const data: Notification[] = await res.json();
      setNotifications(data);
    } catch (error) {
      toast({ title: 'Error', description: (error as Error).message, variant: 'destructive' });
    } finally {
      setIsLoadingData(false);
    }
  }, [user, toast]);

  React.useEffect(() => {
    if (!authIsLoading) {
      if (!user) {
        router.push('/login');
      } else {
        fetchAllNotifications();
      }
    }
  }, [user, authIsLoading, router, fetchAllNotifications]);


  if (authIsLoading || isLoadingData) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="All Notifications"
          description="View your complete notification history."
        />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-2">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="All Notifications"
        description="View your complete notification history."
      />
      <Card>
        <CardHeader>
          <CardTitle>Notification History</CardTitle>
          <CardDescription>A log of all notifications you have received.</CardDescription>
        </CardHeader>
        <CardContent>
          {notifications.length > 0 ? (
            <div className="space-y-2">
              {notifications.map((notification, index) => (
                <React.Fragment key={notification.id}>
                  <NotificationItem notification={notification} />
                  {index < notifications.length - 1 && <Separator />}
                </React.Fragment>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <BellOff className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No Notifications Yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                You haven't received any notifications. We'll let you know when something happens.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
