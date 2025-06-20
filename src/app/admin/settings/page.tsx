
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
import { Info, Save, Users, BellRing, Palette } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

export default function AdminSettingsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [appName, setAppName] = React.useState("EvalTrack");
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [emailNotifications, setEmailNotifications] = React.useState(true);
  const [systemTheme, setSystemTheme] = React.useState("system");

  React.useEffect(() => {
    if (!isLoading && user && user.role !== 'ADMIN') {
      router.push('/login'); 
    }
  }, [user, isLoading, router]);

  if (isLoading || !user || user.role !== 'ADMIN') {
    return <div className="flex justify-center items-center h-screen">Loading or unauthorized...</div>;
  }

  const handleSaveChanges = () => {
    // In a real app, this would save to a backend via API
    toast({
        title: "Settings Saved (Simulated)",
        description: "Your changes to the admin settings have been simulated as saved.",
    });
    // Example API call (if it existed):
    // try {
    //   const response = await fetch('/api/settings', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({ appName, notificationsEnabled, emailNotifications, systemTheme }),
    //   });
    //   if (!response.ok) throw new Error('Failed to save settings');
    //   toast({ title: "Settings Saved", description: "Successfully updated settings." });
    // } catch (error) {
    //   toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
    // }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Admin Settings"
        description="Manage system-wide configurations and perform administrative tasks."
        actions={
          <Button onClick={handleSaveChanges}>
            <Save className="mr-2 h-4 w-4" /> Save All Changes
          </Button>
        }
      />

      <Accordion type="multiple" defaultValue={["general", "notifications"]} className="w-full space-y-4">
        <AccordionItem value="general">
          <Card className="shadow-md">
            <AccordionTrigger className="p-6 hover:no-underline">
                <div className="flex items-center gap-3">
                    <Palette className="h-6 w-6 text-primary" />
                    <div>
                        <CardTitle className="text-lg">General Settings</CardTitle>
                        <CardDescription className="text-sm">Configure basic application settings.</CardDescription>
                    </div>
                </div>
            </AccordionTrigger>
            <AccordionContent>
              <Separator />
              <CardContent className="pt-6 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="appName">Application Name</Label>
                  <Input id="appName" value={appName} onChange={(e) => setAppName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="systemTheme">Default System Theme</Label>
                  <select
                    id="systemTheme"
                    value={systemTheme}
                    onChange={(e) => setSystemTheme(e.target.value)}
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="system">System Default</option>
                  </select>
                </div>
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <h4 className="font-medium">Maintenance Mode</h4>
                    <p className="text-sm text-muted-foreground">Temporarily disable access for users.</p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </AccordionContent>
          </Card>
        </AccordionItem>

        <AccordionItem value="user-management">
          <Card className="shadow-md">
             <AccordionTrigger className="p-6 hover:no-underline">
                <div className="flex items-center gap-3">
                    <Users className="h-6 w-6 text-primary" />
                    <div>
                        <CardTitle className="text-lg">User Management</CardTitle>
                        <CardDescription className="text-sm">Configure user roles and permissions.</CardDescription>
                    </div>
                </div>
            </AccordionTrigger>
            <AccordionContent>
              <Separator />
              <CardContent className="pt-6 space-y-4">
                <p className="text-muted-foreground">User role and permission settings will appear here. (e.g., define roles like Admin, Supervisor, Employee).</p>
                <Button variant="outline" onClick={() => toast({title: "Coming Soon", description: "User role management is not yet implemented."})}>Manage Roles</Button>
              </CardContent>
            </AccordionContent>
          </Card>
        </AccordionItem>

        <AccordionItem value="notifications">
          <Card className="shadow-md">
             <AccordionTrigger className="p-6 hover:no-underline">
                 <div className="flex items-center gap-3">
                    <BellRing className="h-6 w-6 text-primary" />
                    <div>
                        <CardTitle className="text-lg">Notification Preferences</CardTitle>
                        <CardDescription className="text-sm">Set global notification settings.</CardDescription>
                    </div>
                 </div>
            </AccordionTrigger>
            <AccordionContent>
              <Separator />
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <h4 className="font-medium">Enable System Notifications</h4>
                    <p className="text-sm text-muted-foreground">Allow the system to send notifications.</p>
                  </div>
                  <Switch checked={notificationsEnabled} onCheckedChange={setNotificationsEnabled} />
                </div>
                 <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <h4 className="font-medium">Enable Email Notifications</h4>
                    <p className="text-sm text-muted-foreground">Allow the system to send email notifications.</p>
                  </div>
                  <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
                </div>
                <p className="text-muted-foreground text-sm">More granular notification settings (e.g., specific event notifications) can be configured in the Auto Messaging section.</p>
              </CardContent>
            </AccordionContent>
          </Card>
        </AccordionItem>

        <AccordionItem value="data-integrations">
          <Card className="shadow-md">
             <AccordionTrigger className="p-6 hover:no-underline">
                <div className="flex items-center gap-3">
                    <Info className="h-6 w-6 text-primary" />
                    <div>
                        <CardTitle className="text-lg">Data & Integrations</CardTitle>
                        <CardDescription className="text-sm">Manage data backups and external integrations.</CardDescription>
                    </div>
                </div>
            </AccordionTrigger>
            <AccordionContent>
              <Separator />
              <CardContent className="pt-6 space-y-4">
                 <p className="text-muted-foreground">Data backup, export, and integration settings will appear here.</p>
                 <div className="flex gap-2">
                    <Button variant="outline" onClick={() => toast({title: "Coming Soon", description: "Data backup is not yet implemented."})}>Backup Data</Button>
                    <Button variant="outline" onClick={() => toast({title: "Coming Soon", description: "Integration management is not yet implemented."})}>Manage Integrations</Button>
                 </div>
              </CardContent>
            </AccordionContent>
          </Card>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

    