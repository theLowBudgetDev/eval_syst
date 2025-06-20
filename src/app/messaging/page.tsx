
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
import type { AutoMessageTrigger, MessageEventType } from "@/types";
import { PlusCircle, Edit, Trash2, BellRing, MessageSquareText, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

const MESSAGE_EVENT_TYPES: MessageEventType[] = [
  "DEADLINE_APPROACHING",
  "EVALUATION_COMPLETED",
  "FEEDBACK_REQUEST",
  "NEW_ASSIGNMENT",
  "REVIEW_DUE"
];

interface TriggerFormData {
  eventName: MessageEventType;
  messageTemplate: string;
  isActive: boolean;
  daysBeforeEvent?: number | null;
}

export default function AutoMessagingPage() {
  const { user, isLoading: authIsLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [triggers, setTriggers] = React.useState<AutoMessageTrigger[]>([]);
  const [isLoadingData, setIsLoadingData] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false); // For form submission
  const [isDeleting, setIsDeleting] = React.useState(false); // For deletion


  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingTrigger, setEditingTrigger] = React.useState<AutoMessageTrigger | null>(null);
  const [formData, setFormData] = React.useState<TriggerFormData>({
    eventName: "REVIEW_DUE",
    messageTemplate: "",
    isActive: true,
    daysBeforeEvent: null,
  });

  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [triggerToDelete, setTriggerToDelete] = React.useState<AutoMessageTrigger | null>(null);

  const fetchData = React.useCallback(async () => {
    setIsLoadingData(true);
    try {
      const res = await fetch("/api/auto-message-triggers");
      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({ message: `Failed to fetch triggers (status ${res.status}, non-JSON response)` }));
        throw new Error(errorBody.error || errorBody.message || `Failed to fetch triggers (status ${res.status})`);
      }
      setTriggers(await res.json());
    } catch (error) {
      toast({ title: "Error Fetching Data", description: (error as Error).message, variant: "destructive" });
      setTriggers([]);
    } finally {
      setIsLoadingData(false);
    }
  }, [toast]);

  React.useEffect(() => {
    if (!authIsLoading && user) {
      if (user.role !== 'ADMIN') {
        router.push('/login');
      } else {
        fetchData();
      }
    } else if (!authIsLoading && !user) {
      router.push('/login');
    }
  }, [user, authIsLoading, router, fetchData]);

  const handleToggleActive = async (trigger: AutoMessageTrigger) => {
    const updatedTrigger = { ...trigger, isActive: !trigger.isActive };
    // Optimistically update UI
    setTriggers(prev => prev.map(t => t.id === trigger.id ? updatedTrigger : t));
    try {
      const res = await fetch(`/api/auto-message-triggers/${trigger.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: updatedTrigger.isActive }),
      });
      if (!res.ok) {
        // Revert optimistic update on error
        setTriggers(prev => prev.map(t => t.id === trigger.id ? trigger : t));
        const errorBody = await res.json().catch(() => ({ message: `Failed to update trigger (status ${res.status}, non-JSON response)` }));
        throw new Error(errorBody.error || errorBody.message || `Failed to update trigger (status ${res.status})`);
      }
      toast({ title: `Trigger ${updatedTrigger.isActive ? "Activated" : "Deactivated"}` });
      // No need to re-fetch if only status changed and API confirmed
    } catch (error) {
      toast({ title: "Error Updating Trigger", description: (error as Error).message, variant: "destructive" });
    }
  };

  const handleOpenForm = (trigger: AutoMessageTrigger | null = null) => {
    if (trigger) {
      setEditingTrigger(trigger);
      setFormData({
        eventName: trigger.eventName,
        messageTemplate: trigger.messageTemplate,
        isActive: trigger.isActive,
        daysBeforeEvent: trigger.daysBeforeEvent,
      });
    } else {
      setEditingTrigger(null);
      setFormData({ eventName: "REVIEW_DUE", messageTemplate: "", isActive: true, daysBeforeEvent: null });
    }
    setIsFormOpen(true);
  };

  const handleFormSubmit = async () => {
    setIsSubmitting(true);
    const method = editingTrigger ? 'PUT' : 'POST';
    const url = editingTrigger ? `/api/auto-message-triggers/${editingTrigger.id}` : '/api/auto-message-triggers';
    const payload = { ...formData, daysBeforeEvent: formData.daysBeforeEvent ? Number(formData.daysBeforeEvent) : null };

    try {
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({ message: `Failed to save trigger (status ${res.status}, non-JSON response)` }));
        throw new Error(errorBody.error || errorBody.message || `Failed to save trigger (status ${res.status})`);
      }
      toast({ title: `Trigger ${editingTrigger ? 'Updated' : 'Added'}` });
      fetchData();
      setIsFormOpen(false);
    } catch (error) {
      toast({ title: "Error Saving Trigger", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRequest = (trigger: AutoMessageTrigger) => {
    setTriggerToDelete(trigger);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!triggerToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/auto-message-triggers/${triggerToDelete.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({ message: `Failed to delete trigger (status ${res.status}, non-JSON response)` }));
        throw new Error(errorBody.error || errorBody.message || `Failed to delete trigger (status ${res.status})`);
      }
      toast({ title: "Trigger Deleted" });
      fetchData();
    } catch (error) {
      toast({ title: "Error Deleting Trigger", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      setTriggerToDelete(null);
    }
  };
  
  if (authIsLoading || !user || user.role !== 'ADMIN') {
    return (
       <div className="space-y-6">
        <PageHeader title="Auto Messaging Configuration" description="Set up and manage automated messages for platform events."/>
        <Card className="shadow-lg border-border">
            <CardHeader><Skeleton className="h-8 w-3/4" /></CardHeader>
            <CardContent><Skeleton className="h-40 w-full" /></CardContent>
        </Card>
      </div>
    );
  }


  return (
    <div className="space-y-6">
      <PageHeader
        title="Auto Messaging Configuration"
        description="Set up and manage automated messages for platform events."
        actions={
          <Button onClick={() => handleOpenForm()} disabled={isSubmitting}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Trigger
          </Button>
        }
      />

      <Card className="shadow-lg border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><BellRing className="h-5 w-5 text-primary"/> Automated Message Triggers</CardTitle>
          <CardDescription>
            Configure messages that are automatically sent based on specific system events.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingData ? (
             Array.from({length:3}).map((_, index) => (
                <div key={index} className="flex items-center space-x-4 p-4 border-b">
                    <Skeleton className="h-8 w-1/4" />
                    <Skeleton className="h-8 w-1/2" />
                    <Skeleton className="h-8 w-1/4" />
                </div>
             ))
          ) : (
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
                        {trigger.eventName.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground truncate max-w-xs">
                    "{trigger.messageTemplate.substring(0, 60)}{trigger.messageTemplate.length > 60 ? '...' : ''}"
                  </TableCell>
                  <TableCell className="text-sm">
                    {trigger.daysBeforeEvent !== undefined && trigger.daysBeforeEvent !== null ? `${trigger.daysBeforeEvent} days before` : "General Event"}
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={trigger.isActive}
                      onCheckedChange={() => handleToggleActive(trigger)}
                      aria-label={`Toggle ${trigger.eventName} trigger`}
                    />
                     <Badge variant={trigger.isActive ? "default" : "outline"} className="mt-1 block w-fit mx-auto">
                        {trigger.isActive ? "Active" : "Inactive"}
                     </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="icon" onClick={() => handleOpenForm(trigger)} disabled={isSubmitting}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="destructive" size="icon" onClick={() => handleDeleteRequest(trigger)} disabled={isDeleting}>
                      <Trash2 className="h-4 w-4" />
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
          )}
        </CardContent>
      </Card>

      {isFormOpen && (
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingTrigger ? "Edit" : "Add"} Auto Message Trigger</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
                <div className="space-y-1">
                    <Label htmlFor="trigger-event">Event Name</Label>
                    <Select
                        value={formData.eventName}
                        onValueChange={(value) => setFormData({...formData, eventName: value as MessageEventType})}
                        disabled={isSubmitting}
                    >
                        <SelectTrigger id="trigger-event"><SelectValue placeholder="Select event type" /></SelectTrigger>
                        <SelectContent>
                            {MESSAGE_EVENT_TYPES.map(type => (
                                <SelectItem key={type} value={type}>
                                    {type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-1">
                    <Label htmlFor="trigger-template">Message Template</Label>
                    <Textarea id="trigger-template" value={formData.messageTemplate} onChange={e => setFormData({...formData, messageTemplate: e.target.value})} placeholder="e.g., Hi {{employeeName}}, your review is due on {{reviewDate}}." disabled={isSubmitting}/>
                    <p className="text-xs text-muted-foreground">Available placeholders: {{employeeName}}, {{supervisorName}}, {{deadlineDate}}, etc. (Context-dependent)</p>
                </div>
                 <div className="space-y-1">
                    <Label htmlFor="trigger-days">Days Before Event (Optional)</Label>
                    <Input id="trigger-days" type="number" value={formData.daysBeforeEvent ?? ""} onChange={e => setFormData({...formData, daysBeforeEvent: e.target.value ? parseInt(e.target.value) : null})} disabled={isSubmitting}/>
                </div>
                <div className="flex items-center space-x-2">
                    <Switch id="trigger-active" checked={formData.isActive} onCheckedChange={checked => setFormData({...formData, isActive: checked})} disabled={isSubmitting}/>
                    <Label htmlFor="trigger-active">Active</Label>
                </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsFormOpen(false)} disabled={isSubmitting}>Cancel</Button>
              <Button onClick={handleFormSubmit} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Trigger
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {showDeleteConfirm && triggerToDelete && (
        <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Confirm Deletion</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to delete the trigger for "<strong>{triggerToDelete.eventName.replace(/_/g, ' ')}</strong>"? This cannot be undone.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} disabled={isDeleting}>Cancel</Button>
                    <Button variant="destructive" onClick={confirmDelete} disabled={isDeleting}>
                        {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Delete
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      )}

    </div>
  );
}
