
"use client";

import Link from "next/link";
import { formatDistanceToNow } from 'date-fns';
import { cn } from "@/lib/utils";
import type { Notification } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function NotificationItem({ notification }: { notification: Notification }) {
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
