
"use client";

import * as React from "react";
import Link from "next/link";
import { Bell, BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type { Notification } from "@/types";
import { cn } from "@/lib/utils";
import { NotificationItem } from "./NotificationItem";

interface NotificationBellProps {
  notifications: Notification[];
  unreadCount: number;
  onOpen: () => void;
  className?: string;
}

export function NotificationBell({
  notifications,
  unreadCount,
  onOpen,
  className
}: NotificationBellProps) {
  return (
    <Popover onOpenChange={(open) => { if(open) onOpen(); }}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("relative", className)}
          aria-label={`View notifications (${unreadCount} unread)`}
        >
          {unreadCount > 0 ? (
            <BellRing className="h-5 w-5 text-primary animate-bounce-opacity" />
          ) : (
            <Bell className="h-5 w-5" />
          )}
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4">
            <h4 className="font-medium text-sm">Notifications</h4>
        </div>
        <Separator />
        <ScrollArea className="h-96">
          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <NotificationItem key={notification.id} notification={notification} />
            ))
          ) : (
            <div className="p-4 text-center text-sm text-muted-foreground">
              You have no new notifications.
            </div>
          )}
        </ScrollArea>
        <Separator />
         <div className="p-2">
             <Button variant="link" size="sm" asChild className="w-full">
                 <Link href="/my-notifications">View All Notifications</Link>
             </Button>
         </div>
      </PopoverContent>
    </Popover>
  );
}
