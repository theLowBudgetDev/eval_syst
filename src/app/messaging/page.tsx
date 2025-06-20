
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
import { PlusCircle, Edit, Trash2, BellRing, MessageSquareText } from "lucide-react";
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
      if (!res.ok) throw new Error("Failed to fetch auto message triggers");
      setTriggers(await res.json());
    } catch (error) {
      toast({ title: "Error fetching data", description: (error as Error).message, variant: "destructive" });
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


  if (authIsLoading || isLoadingData || !user || user.role !== 'ADMIN') {
    return <div className="flex justify-center items-center h-screen">Loading or unauthorized...</div>;
  }
  
  const handleToggleActive = async (trigger: AutoMessageTrigger) => {
    const updatedTrigger = { ...trigger, isActive: !trigger.isActive };
    try {
      const res = await fetch(`/api/auto-message-triggers/${trigger.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: updatedTrigger.isActive }),
      });
      if (!res.ok) throw new Error("Failed to update trigger status");
      setTriggers(prev => prev.map(t => t.id === trigger.id ? updatedTrigger : t));
      toast({ title: `Trigger ${updatedTrigger.isActive ? "Activated" : "Deactivated"}` });
    } catch (error) {
      toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
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
    const method = editingTrigger ? 'PUT' : 'POST';
    const url = editingTrigger ? `/api/auto-message-triggers/${editingTrigger.id}` : '/api/auto-message-triggers';
    const payload = { ...formData, daysBeforeEvent: formData.daysBeforeEvent ? Number(formData.daysBeforeEvent) : null };

    try {
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) { const err = await res.json(); throw new Error(err.message || 'Failed to save trigger'); }
      toast({ title: `Trigger ${editingTrigger ? 'Updated' : 'Added'}` });
      fetchData();
      setIsFormOpen(false);
    } catch (error) {
      toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
    }
  };
  
  const handleDeleteRequest = (trigger: AutoMessageTrigger) => {
    setTriggerToDelete(trigger);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!triggerToDelete) return;
    try {
      const res = await fetch(`/api/auto-message-triggers/${triggerToDelete.id}`, { method: 'DELETE' });
      if (!res.ok) { const err = await res.json(); throw new Error(err.message || 'Failed to delete trigger'); }
      toast({ title: "Trigger Deleted" });
      fetchData();
    } catch (error) {
      toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
    } finally {
      setShowDeleteConfirm(false);
      setTriggerToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Auto Messaging Configuration"
        description="Set up and manage automated messages for platform events."
        actions={
          <Button onClick={() => handleOpenForm()}>
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
                    <Button variant="outline" size="icon" onClick={() => handleOpenForm(trigger)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="destructive" size="icon" onClick={() => handleDeleteRequest(trigger)}>
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
        </CardContent>
      </Card>

      {isFormOpen && (
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingTrigger ? "Edit" : "Add"} Auto Message Trigger</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="space-y-1">
                    <Label htmlFor="trigger-event">Event Name</Label>
                    <Select 
                        value={formData.eventName} 
                        onValueChange={(value) => setFormData({...formData, eventName: value as MessageEventType})}
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
                    <Textarea id="trigger-template" value={formData.messageTemplate} onChange={e => setFormData({...formData, messageTemplate: e.target.value})} placeholder="e.g., Hi {{employeeName}}, your review is due on {{reviewDate}}." />
                    <p className="text-xs text-muted-foreground">Available placeholders: {{employeeName}}, {{supervisorName}}, {{deadlineDate}}, etc. (Context-dependent)</p>
                </div>
                 <div className="space-y-1">
                    <Label htmlFor="trigger-days">Days Before Event (Optional)</Label>
                    <Input id="trigger-days" type="number" value={formData.daysBeforeEvent ?? ""} onChange={e => setFormData({...formData, daysBeforeEvent: e.target.value ? parseInt(e.target.value) : null})} />
                </div>
                <div className="flex items-center space-x-2">
                    <Switch id="trigger-active" checked={formData.isActive} onCheckedChange={checked => setFormData({...formData, isActive: checked})} />
                    <Label htmlFor="trigger-active">Active</Label>
                </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
              <Button onClick={handleFormSubmit}>Save Trigger</Button>
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
                        Are you sure you want to delete the trigger for "{triggerToDelete.eventName.replace(/_/g, ' ')}"? This cannot be undone.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
                    <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      )}

    </div>
  );
}

    