
"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Info, Save, Users, BellRing, Palette, Settings2, ShieldAlert, DatabaseZap, MessageCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

export default function AdminSettingsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [appName, setAppName] = React.useState("EvalTrack");
  const [systemTheme, setSystemTheme] = React.useState("system");
  const [maintenanceMode, setMaintenanceMode] = React.useState(false);

  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [emailNotifications, setEmailNotifications] = React.useState(true);
  
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    if (!isLoading && user && user.role !== 'ADMIN') {
      router.push('/login'); 
    }
  }, [user, isLoading, router]);

  if (isLoading || !user || user.role !== 'ADMIN') {
    return <div className="flex justify-center items-center h-screen">Loading or unauthorized...</div>;
  }

  const handleSaveChanges = () => {
    setIsSaving(true);
    // In a real app, this would save to a backend via API
    console.log("Saving Admin Settings:", {
      appName,
      systemTheme,
      maintenanceMode,
      notificationsEnabled,
      emailNotifications,
    });
    setTimeout(() => {
      toast({
          title: "Settings Saved",
          description: "Your changes to the admin settings have been successfully saved (simulated).",
      });
      setIsSaving(false);
    }, 1000);
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Admin Settings"
        description="Manage system-wide configurations and perform administrative tasks."
        actions={
          <Button onClick={handleSaveChanges} disabled={isSaving}>
            {isSaving ? <Save className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
             Save All Changes
          </Button>
        }
      />

      <Accordion type="multiple" defaultValue={["general", "notifications"]} className="w-full space-y-4">
        <AccordionItem value="general">
          <Card className="shadow-md border-border">
            <AccordionTrigger className="p-6 hover:no-underline">
                <div className="flex items-center gap-3">
                    <Palette className="h-6 w-6 text-primary" />
                    <div>
                        <CardTitle className="text-lg">General Settings</CardTitle>
                        <CardDescription className="text-sm">Configure basic application appearance and behavior.</CardDescription>
                    </div>
                </div>
            </AccordionTrigger>
            <AccordionContent>
              <Separator />
              <CardContent className="pt-6 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="appName">Application Name</Label>
                  <Input id="appName" value={appName} onChange={(e) => setAppName(e.target.value)} disabled={isSaving} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="systemTheme">Default System Theme</Label>
                  <Select value={systemTheme} onValueChange={setSystemTheme} disabled={isSaving}>
                    <SelectTrigger id="systemTheme">
                      <SelectValue placeholder="Select theme" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System Default</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <h4 className="font-medium">Maintenance Mode</h4>
                    <p className="text-sm text-muted-foreground">Temporarily disable access for non-admin users.</p>
                  </div>
                  <Switch checked={maintenanceMode} onCheckedChange={setMaintenanceMode} disabled={isSaving} />
                </div>
              </CardContent>
            </AccordionContent>
          </Card>
        </AccordionItem>

        <AccordionItem value="user-management">
          <Card className="shadow-md border-border">
             <AccordionTrigger className="p-6 hover:no-underline">
                <div className="flex items-center gap-3">
                    <Users className="h-6 w-6 text-primary" />
                    <div>
                        <CardTitle className="text-lg">User Management</CardTitle>
                        <CardDescription className="text-sm">Configure user roles, permissions, and access.</CardDescription>
                    </div>
                </div>
            </AccordionTrigger>
            <AccordionContent>
              <Separator />
              <CardContent className="pt-6 space-y-4">
                <p className="text-muted-foreground">Manage employee records, roles, and supervisor assignments.</p>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => router.push('/employees')}>Manage Employees</Button>
                    <Button variant="outline" onClick={() => router.push('/assignments')}>Supervisor Assignments</Button>
                </div>
              </CardContent>
            </AccordionContent>
          </Card>
        </AccordionItem>

        <AccordionItem value="notifications">
          <Card className="shadow-md border-border">
             <AccordionTrigger className="p-6 hover:no-underline">
                 <div className="flex items-center gap-3">
                    <BellRing className="h-6 w-6 text-primary" />
                    <div>
                        <CardTitle className="text-lg">Notification Preferences</CardTitle>
                        <CardDescription className="text-sm">Set global notification settings and automated messages.</CardDescription>
                    </div>
                 </div>
            </AccordionTrigger>
            <AccordionContent>
              <Separator />
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <h4 className="font-medium">Enable System Notifications</h4>
                    <p className="text-sm text-muted-foreground">Allow the system to generate in-app notifications.</p>
                  </div>
                  <Switch checked={notificationsEnabled} onCheckedChange={setNotificationsEnabled} disabled={isSaving}/>
                </div>
                 <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <h4 className="font-medium">Enable Email Notifications</h4>
                    <p className="text-sm text-muted-foreground">Allow the system to send email notifications (if configured).</p>
                  </div>
                  <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} disabled={isSaving}/>
                </div>
                <Button variant="outline" onClick={() => router.push('/messaging')}>
                    <MessageCircle className="mr-2 h-4 w-4" /> Configure Auto-Messaging Triggers
                </Button>
              </CardContent>
            </AccordionContent>
          </Card>
        </AccordionItem>
        
        <AccordionItem value="evaluation-settings">
          <Card className="shadow-md border-border">
             <AccordionTrigger className="p-6 hover:no-underline">
                <div className="flex items-center gap-3">
                    <Settings2 className="h-6 w-6 text-primary" />
                    <div>
                        <CardTitle className="text-lg">Evaluation & Progress Settings</CardTitle>
                        <CardDescription className="text-sm">Manage criteria, review cycles, and progress tracking.</CardDescription>
                    </div>
                </div>
            </AccordionTrigger>
            <AccordionContent>
              <Separator />
              <CardContent className="pt-6 space-y-4">
                 <p className="text-muted-foreground">Define evaluation criteria and monitor employee progress.</p>
                 <div className="flex gap-2">
                    <Button variant="outline" onClick={() => router.push('/evaluations')}>Manage Evaluation Criteria</Button>
                    <Button variant="outline" onClick={() => router.push('/progress')}>Monitor Progress</Button>
                 </div>
              </CardContent>
            </AccordionContent>
          </Card>
        </AccordionItem>

        <AccordionItem value="data-integrations">
          <Card className="shadow-md border-border">
             <AccordionTrigger className="p-6 hover:no-underline">
                <div className="flex items-center gap-3">
                    <DatabaseZap className="h-6 w-6 text-primary" />
                    <div>
                        <CardTitle className="text-lg">Data & Integrations</CardTitle>
                        <CardDescription className="text-sm">Manage data backups, exports, and external integrations.</CardDescription>
                    </div>
                </div>
            </AccordionTrigger>
            <AccordionContent>
              <Separator />
              <CardContent className="pt-6 space-y-4">
                 <p className="text-muted-foreground">Data backup, export, and integration settings will appear here.</p>
                 <div className="flex gap-2">
                    <Button variant="outline" onClick={() => toast({title: "Coming Soon", description: "Data backup is not yet implemented."})} disabled={isSaving}>Backup Data</Button>
                    <Button variant="outline" onClick={() => toast({title: "Coming Soon", description: "Integration management is not yet implemented."})} disabled={isSaving}>Manage Integrations</Button>
                 </div>
              </CardContent>
            </AccordionContent>
          </Card>
        </AccordionItem>

         <AccordionItem value="security-compliance">
          <Card className="shadow-md border-border">
             <AccordionTrigger className="p-6 hover:no-underline">
                <div className="flex items-center gap-3">
                    <ShieldAlert className="h-6 w-6 text-primary" />
                    <div>
                        <CardTitle className="text-lg">Security & Compliance</CardTitle>
                        <CardDescription className="text-sm">Configure security policies and view audit logs.</CardDescription>
                    </div>
                </div>
            </AccordionTrigger>
            <AccordionContent>
              <Separator />
              <CardContent className="pt-6 space-y-4">
                 <p className="text-muted-foreground">Security settings, audit logs, and compliance tools will be available here.</p>
                 <div className="flex gap-2">
                    <Button variant="outline" onClick={() => toast({title: "Coming Soon", description: "Audit logs are not yet implemented."})} disabled={isSaving}>View Audit Logs</Button>
                 </div>
              </CardContent>
            </AccordionContent>
          </Card>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
