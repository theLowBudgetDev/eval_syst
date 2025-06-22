
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import type { Notification } from "@/types";
import { formatDistanceToNow } from 'date-fns';
import { cn } from "@/lib/utils";

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

function NotificationItem({ notification }: { notification: Notification }) {
    const timeAgo = formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true });

    const content = (
        <div className={cn(
            "flex items-start gap-3 p-3 transition-colors hover:bg-accent",
            !notification.isRead && "bg-primary/5 hover:bg-accent"
        )}>
             <Avatar className="h-8 w-8 mt-1">
                <AvatarImage src={notification.actor?.avatarUrl || undefined} alt={notification.actor?.name || 'System'} data-ai-hint="person face"/>
                <AvatarFallback>{notification.actor?.name?.[0] || 'S'}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
                <p className="text-sm">
                    <span className="font-semibold">{notification.actor?.name || 'System'}</span>
                    {' '}{notification.message}
                </p>
                <p className="text-xs text-muted-foreground">{timeAgo}</p>
            </div>
             {!notification.isRead && (
                <div className="h-2 w-2 rounded-full bg-primary mt-1 flex-shrink-0" title="Unread"></div>
            )}
        </div>
    );

    if (notification.link) {
        return <Link href={notification.link}>{content}</Link>;
    }
    return content;
}
