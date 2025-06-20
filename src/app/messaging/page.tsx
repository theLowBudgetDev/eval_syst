
"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { mockAutoMessageTriggers } from "@/lib/mockData";
import type { AutoMessageTrigger } from "@/types";
import { PlusCircle, Edit, Trash2, BellRing, MessageSquareText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";


export default function AutoMessagingPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [triggers, setTriggers] = React.useState<AutoMessageTrigger[]>(mockAutoMessageTriggers);
  const { toast } = useToast();

  React.useEffect(() => {
    if (!isLoading && user && user.role !== 'admin') {
      router.push('/login'); 
    }
  }, [user, isLoading, router]);

  if (isLoading || !user || user.role !== 'admin') {
    return <div className="flex justify-center items-center h-screen">Loading or unauthorized...</div>;
  }

  const handleToggleActive = (triggerId: string) => {
    setTriggers((prevTriggers) =>
      prevTriggers.map((trigger) =>
        trigger.id === triggerId ? { ...trigger, isActive: !trigger.isActive } : trigger
      )
    );
    const updatedTrigger = triggers.find(t => t.id === triggerId);
    toast({
      title: `Trigger ${updatedTrigger && !updatedTrigger.isActive ? "Activated" : "Deactivated"}`, // Logic was inverted
      description: `Trigger "${updatedTrigger?.eventName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}" is now ${updatedTrigger && !updatedTrigger.isActive ? "active" : "inactive"}.`,
    });
  };

  const handleEditTrigger = (trigger: AutoMessageTrigger) => {
    toast({ title: "Coming Soon", description: "Edit trigger functionality will be available soon."});
  };
  
  const handleDeleteTrigger = (triggerId: string) => {
    toast({ title: "Coming Soon", description: "Delete trigger functionality will be available soon."});
  };

  const handleAddNewTrigger = () => {
    toast({ title: "Coming Soon", description: "Add new trigger functionality will be available soon."});
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Auto Messaging Configuration"
        description="Set up and manage automated messages for platform events."
        actions={
          <Button onClick={handleAddNewTrigger}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Trigger
          </Button>
        }
      />

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><BellRing className="h-5 w-5 text-primary"/> Automated Message Triggers</CardTitle>
          <CardDescription>
            Configure messages that are automatically sent based on specific system events.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Event Name</TableHead>
                <TableHead>Message Template Preview</TableHead>
                <TableHead className="w-[150px]">Conditions</TableHead>
                <TableHead className="w-[100px] text-center">Status</TableHead>
                <TableHead className="text-right w-[150px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {triggers.length > 0 ? triggers.map((trigger) => (
                <TableRow key={trigger.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                        <MessageSquareText className="h-4 w-4 text-muted-foreground"/>
                        {trigger.eventName.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground truncate max-w-xs">
                    "{trigger.messageTemplate.substring(0, 60)}{trigger.messageTemplate.length > 60 ? '...' : ''}"
                  </TableCell>
                  <TableCell className="text-sm">
                    {trigger.daysBeforeEvent !== undefined ? `${trigger.daysBeforeEvent} days before event` : "General Event"}
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={trigger.isActive}
                      onCheckedChange={() => handleToggleActive(trigger.id)}
                      aria-label={`Toggle ${trigger.eventName} trigger`}
                    />
                     <Badge variant={trigger.isActive ? "default" : "outline"} className="mt-1 block w-fit mx-auto">
                        {trigger.isActive ? "Active" : "Inactive"}
                     </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="icon" onClick={() => handleEditTrigger(trigger)}>
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                    <Button variant="destructive" size="icon" onClick={() => handleDeleteTrigger(trigger.id)}>
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                    No automated message triggers configured yet.
                    </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
