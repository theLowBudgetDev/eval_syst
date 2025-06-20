
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
import { Save, Users, BellRing, Palette, Settings2, ShieldAlert, History, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import type { SystemSetting } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";

const DEFAULT_SETTINGS: Omit<SystemSetting, 'id' | 'createdAt' | 'updatedAt'> = {
  appName: "EvalTrack",
  systemTheme: "system",
  maintenanceMode: false,
  notificationsEnabled: true,
  emailNotifications: true,
};

export default function AdminSettingsPage() {
  const { user, isLoading: authIsLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [settings, setSettings] = React.useState<Omit<SystemSetting, 'id' | 'createdAt' | 'updatedAt'>>(DEFAULT_SETTINGS);
  const [isLoadingSettings, setIsLoadingSettings] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    if (!authIsLoading && user && user.role === 'ADMIN') {
      setIsLoadingSettings(true);
      const headers = new Headers();
      headers.append('X-User-Id', user.id);
      headers.append('X-User-Role', user.role);

      fetch('/api/admin/settings', { headers })
        .then(async res => {
          if (!res.ok) {
            const errorBody = await res.json().catch(() => ({ message: "Failed to fetch settings" }));
            throw new Error(errorBody.message);
          }
          return res.json();
        })
        .then((data: SystemSetting) => {
          const { id, createdAt, updatedAt, ...rest } = data;
          setSettings(rest);
        })
        .catch(error => {
          toast({ title: "Error Loading Settings", description: (error as Error).message, variant: "destructive" });
          setSettings(DEFAULT_SETTINGS); // Fallback to defaults on error
        })
        .finally(() => setIsLoadingSettings(false));
    } else if (!authIsLoading && (!user || user.role !== 'ADMIN')) {
      router.push('/login');
    }
  }, [user, authIsLoading, router, toast]);

  const handleInputChange = (field: keyof typeof settings, value: string | boolean) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveChanges = async () => {
    if (!user) return;
    setIsSaving(true);
    
    const headers = new Headers();
    headers.append('X-User-Id', user.id);
    headers.append('X-User-Role', user.role);
    headers.append('Content-Type', 'application/json');

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers,
        body: JSON.stringify(settings),
      });
      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({ message: "Failed to save settings" }));
        throw new Error(errorBody.message);
      }
      const updatedSettings: SystemSetting = await res.json();
      const { id, createdAt, updatedAt, ...rest } = updatedSettings;
      setSettings(rest);
      toast({
          title: "Settings Saved",
          description: "Your changes to the system settings have been successfully saved.",
      });
    } catch (error) {
      toast({ title: "Error Saving Settings", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };
  
  if (authIsLoading || isLoadingSettings) {
    return (
        <div className="space-y-8">
            <PageHeader title="Admin Settings" description="Manage system-wide configurations."/>
            <Skeleton className="h-12 w-32" /> {/* For Save Button */}
            <Card className="shadow-md"><CardHeader><Skeleton className="h-6 w-1/2"/></CardHeader><CardContent><Skeleton className="h-20 w-full"/></CardContent></Card>
            <Card className="shadow-md"><CardHeader><Skeleton className="h-6 w-1/2"/></CardHeader><CardContent><Skeleton className="h-20 w-full"/></CardContent></Card>
        </div>
    );
  }

  if (!user || user.role !== 'ADMIN') {
    // This case should be handled by the useEffect redirect, but as a fallback:
    return <div className="flex justify-center items-center h-screen">Loading or unauthorized...</div>;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Admin Settings"
        description="Manage system-wide configurations and perform administrative tasks."
        actions={
          <Button onClick={handleSaveChanges} disabled={isSaving || isLoadingSettings}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
             Save All Changes
          </Button>
        }
      />

      <Accordion type="multiple" defaultValue={["general", "notifications"]} className="w-full space-y-4">
        <AccordionItem value="general">
          <Card className="shadow-md border-border">
            <AccordionTrigger className="p-6 hover:no-underline w-full">
                <div className="flex items-center gap-3 w-full">
                    <Palette className="h-6 w-6 text-primary flex-shrink-0" />
                    <div className="flex-1 text-left">
                        <CardTitle className="text-lg">General Settings</CardTitle>
                        <CardDescription className="text-sm text-muted-foreground">Configure basic application appearance and behavior.</CardDescription>
                    </div>
                </div>
            </AccordionTrigger>
            <AccordionContent>
              <Separator />
              <CardContent className="pt-6 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="appName">Application Name</Label>
                  <Input id="appName" value={settings.appName} onChange={(e) => handleInputChange('appName', e.target.value)} disabled={isSaving} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="systemTheme">Default System Theme</Label>
                  <Select value={settings.systemTheme} onValueChange={(value) => handleInputChange('systemTheme', value)} disabled={isSaving}>
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
                  <Switch checked={settings.maintenanceMode} onCheckedChange={(checked) => handleInputChange('maintenanceMode', checked)} disabled={isSaving} />
                </div>
              </CardContent>
            </AccordionContent>
          </Card>
        </AccordionItem>

        <AccordionItem value="user-management">
          <Card className="shadow-md border-border">
             <AccordionTrigger className="p-6 hover:no-underline w-full">
                <div className="flex items-center gap-3 w-full">
                    <Users className="h-6 w-6 text-primary flex-shrink-0" />
                    <div className="flex-1 text-left">
                        <CardTitle className="text-lg">User Management</CardTitle>
                        <CardDescription className="text-sm text-muted-foreground">Configure user roles, permissions, and access.</CardDescription>
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
             <AccordionTrigger className="p-6 hover:no-underline w-full">
                 <div className="flex items-center gap-3 w-full">
                    <BellRing className="h-6 w-6 text-primary flex-shrink-0" />
                    <div className="flex-1 text-left">
                        <CardTitle className="text-lg">Notification Preferences</CardTitle>
                        <CardDescription className="text-sm text-muted-foreground">Set global notification settings and automated messages.</CardDescription>
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
                  <Switch checked={settings.notificationsEnabled} onCheckedChange={(checked) => handleInputChange('notificationsEnabled', checked)} disabled={isSaving}/>
                </div>
                 <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <h4 className="font-medium">Enable Email Notifications</h4>
                    <p className="text-sm text-muted-foreground">Allow the system to send email notifications (if configured).</p>
                  </div>
                  <Switch checked={settings.emailNotifications} onCheckedChange={(checked) => handleInputChange('emailNotifications', checked)} disabled={isSaving}/>
                </div>
                <Button variant="outline" onClick={() => router.push('/messaging')}>
                     Configure Auto-Messaging Triggers
                </Button>
              </CardContent>
            </AccordionContent>
          </Card>
        </AccordionItem>
        
        <AccordionItem value="evaluation-settings">
          <Card className="shadow-md border-border">
             <AccordionTrigger className="p-6 hover:no-underline w-full">
                <div className="flex items-center gap-3 w-full">
                    <Settings2 className="h-6 w-6 text-primary flex-shrink-0" />
                    <div className="flex-1 text-left">
                        <CardTitle className="text-lg">Evaluation &amp; Progress Settings</CardTitle>
                        <CardDescription className="text-sm text-muted-foreground">Manage criteria, review cycles, and progress tracking.</CardDescription>
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

         <AccordionItem value="security-compliance">
          <Card className="shadow-md border-border">
             <AccordionTrigger className="p-6 hover:no-underline w-full">
                <div className="flex items-center gap-3 w-full">
                    <ShieldAlert className="h-6 w-6 text-primary flex-shrink-0" />
                    <div className="flex-1 text-left">
                        <CardTitle className="text-lg">Security &amp; Compliance</CardTitle>
                        <CardDescription className="text-sm text-muted-foreground">Configure security policies and view audit logs.</CardDescription>
                    </div>
                </div>
            </AccordionTrigger>
            <AccordionContent>
              <Separator />
              <CardContent className="pt-6 space-y-4">
                 <p className="text-muted-foreground">Security settings, audit logs, and compliance tools will be available here.</p>
                 <div className="flex gap-2">
                    <Button variant="outline" onClick={() => router.push('/admin/audit-logs')} disabled={isSaving}>
                        <History className="mr-2 h-4 w-4" /> View Audit Logs
                    </Button>
                 </div>
              </CardContent>
            </AccordionContent>
          </Card>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
