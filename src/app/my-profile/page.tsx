
"use client";

import * as React from "react";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Edit, Loader2, KeyRound } from "lucide-react";
import { EmployeeForm } from "@/components/employees/EmployeeForm";
import type { AppUser } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const passwordFormSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required."),
  newPassword: z.string().min(8, "New password must be at least 8 characters."),
  confirmPassword: z.string()
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "New passwords do not match.",
  path: ["confirmPassword"], // path of error
});

type PasswordFormData = z.infer<typeof passwordFormSchema>;

const toBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });

export default function MyProfilePage() {
  const { user: loggedInUser, isLoading: authIsLoading, login: updateAuthContextUser, logout } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [isFetchingSupervisors, setIsFetchingSupervisors] = React.useState(false);
  const [supervisorsForForm, setSupervisorsForForm] = React.useState<AppUser[]>([]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  const [currentUserDetails, setCurrentUserDetails] = React.useState<AppUser | null>(loggedInUser);
  const [isChangingPassword, setIsChangingPassword] = React.useState(false);

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" }
  });

  React.useEffect(() => {
    if (!authIsLoading && loggedInUser) {
        setCurrentUserDetails(loggedInUser);
    }
  }, [loggedInUser, authIsLoading]);

  const fetchSupervisors = async () => {
    if (loggedInUser?.role !== 'ADMIN') {
        setSupervisorsForForm([]);
        return;
    }
    setIsFetchingSupervisors(true);
    try {
      const res = await fetch("/api/supervisors");
      if (!res.ok) throw new Error("Failed to fetch supervisors");
      const data = await res.json();
      setSupervisorsForForm(data);
    } catch (error) {
      toast({ title: "Error", description: "Could not load supervisor list for form.", variant: "destructive" });
    } finally {
      setIsFetchingSupervisors(false);
    }
  };

  const handleOpenEditForm = () => {
    if (loggedInUser?.role === 'ADMIN') {
        fetchSupervisors(); 
    }
    setIsFormOpen(true);
  }

  const handleFormSubmit = async (employeeData: Partial<AppUser>, isEditing: boolean, avatarFile?: File | null) => {
    if (!loggedInUser || employeeData.id !== loggedInUser.id) {
        toast({ title: "Error", description: "Invalid operation. Cannot update profile.", variant: "destructive"});
        return;
    }
    setIsSubmitting(true);
    
    let finalAvatarUrl = employeeData.avatarUrl;

    if (avatarFile) {
      try {
        finalAvatarUrl = await toBase64(avatarFile);
      } catch (error) {
        toast({ title: "Avatar Upload Failed", description: "Could not read the selected image file.", variant: "destructive"});
        setIsSubmitting(false);
        return;
      }
    }
    
    const payload = { ...employeeData, avatarUrl: finalAvatarUrl };
    if (payload.hireDate && payload.hireDate.includes('T')) {
        payload.hireDate = payload.hireDate.split('T')[0];
    }
    if (loggedInUser.role !== 'ADMIN') {
        delete (payload as any).role;
        delete (payload as any).supervisorId;
    }

    try {
        const res = await fetch(`/api/users/${loggedInUser.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || "Failed to update profile");
        }
        const updatedUserFromApi = await res.json();
        // Since API doesn't return full nested user, merge essential fields
        const updatedContextUser = { ...loggedInUser, ...updatedUserFromApi };
        updateAuthContextUser(updatedContextUser); 
        setCurrentUserDetails(updatedContextUser); 
        toast({ title: "Profile Updated", description: "Your details have been successfully updated."});
        setIsFormOpen(false);
    } catch (error) {
        toast({ title: "Update Failed", description: (error as Error).message, variant: "destructive"});
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const handlePasswordChangeSubmit = async (data: PasswordFormData) => {
    if (!loggedInUser) return;
    setIsChangingPassword(true);

    const headers = new Headers();
    headers.append('X-User-Id', loggedInUser.id);
    headers.append('X-User-Role', loggedInUser.role);
    headers.append('Content-Type', 'application/json');

    try {
      const res = await fetch(`/api/users/${loggedInUser.id}/change-password`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to change password");
      }

      toast({ title: "Password Changed", description: "Your password has been successfully updated." });
      passwordForm.reset();
    } catch (error) {
      toast({ title: "Password Change Failed", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsChangingPassword(false);
    }
  };


  if (authIsLoading || !currentUserDetails) {
    return (
      <div className="space-y-6">
        <PageHeader title="My Profile" description="View and manage your personal information." />
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-4">
              <Skeleton className="h-20 w-20 rounded-full" />
              <div>
                <Skeleton className="h-8 w-48 mb-2" />
                <Skeleton className="h-6 w-32" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              {[...Array(5)].map((_, i) => (
                <div key={i}>
                  <Skeleton className="h-4 w-24 mb-1" />
                  <Skeleton className="h-5 w-40" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Profile"
        description="View and manage your personal information."
        actions={
            <Button onClick={handleOpenEditForm} disabled={isFetchingSupervisors || isSubmitting}>
                {isFetchingSupervisors || isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Edit className="mr-2 h-4 w-4" />}
                Edit Profile
            </Button>
        }
      />

      <Card className="shadow-lg border-border">
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20 border">
              <AvatarImage src={currentUserDetails.avatarUrl || undefined} alt={currentUserDetails.name} data-ai-hint="person face"/>
              <AvatarFallback>{currentUserDetails.name.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-3xl font-headline">{currentUserDetails.name}</CardTitle>
              <CardDescription className="text-lg">{currentUserDetails.position}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 text-sm">
            <div>
              <Label className="text-muted-foreground font-semibold">Email Address</Label>
              <p className="mt-0.5">{currentUserDetails.email}</p>
            </div>
            <div>
              <Label className="text-muted-foreground font-semibold">Department</Label>
              <div><Badge variant="secondary" className="mt-0.5">{currentUserDetails.department}</Badge></div>
            </div>
            <div>
              <Label className="text-muted-foreground font-semibold">Hire Date</Label>
              <p className="mt-0.5">{format(new Date(currentUserDetails.hireDate), "MMMM d, yyyy")}</p>
            </div>
            <div>
              <Label className="text-muted-foreground font-semibold">Supervisor</Label>
              <p className="mt-0.5">{currentUserDetails.supervisor?.name || "N/A"}</p>
            </div>
             <div>
              <Label className="text-muted-foreground font-semibold">Role</Label>
              <p className="capitalize mt-0.5">{currentUserDetails.role.toLowerCase()}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="shadow-lg border-border">
        <CardHeader>
            <CardTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5 text-primary"/>Change Password</CardTitle>
            <CardDescription>Update your password here. Use a strong, unique password.</CardDescription>
        </CardHeader>
        <form onSubmit={passwordForm.handleSubmit(handlePasswordChangeSubmit)}>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input id="currentPassword" type="password" {...passwordForm.register("currentPassword")} disabled={isChangingPassword}/>
                    {passwordForm.formState.errors.currentPassword && <p className="text-sm text-destructive">{passwordForm.formState.errors.currentPassword.message}</p>}
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="newPassword">New Password</Label>
                        <Input id="newPassword" type="password" {...passwordForm.register("newPassword")} disabled={isChangingPassword}/>
                        {passwordForm.formState.errors.newPassword && <p className="text-sm text-destructive">{passwordForm.formState.errors.newPassword.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                        <Input id="confirmPassword" type="password" {...passwordForm.register("confirmPassword")} disabled={isChangingPassword}/>
                        {passwordForm.formState.errors.confirmPassword && <p className="text-sm text-destructive">{passwordForm.formState.errors.confirmPassword.message}</p>}
                    </div>
                </div>
            </CardContent>
            <CardFooter>
                <Button type="submit" disabled={isChangingPassword}>
                    {isChangingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                    Update Password
                </Button>
            </CardFooter>
        </form>
      </Card>
      
      {isFormOpen && currentUserDetails && (
        <EmployeeForm
          isOpen={isFormOpen}
          setIsOpen={setIsFormOpen}
          employee={currentUserDetails} 
          onSubmit={handleFormSubmit}
          supervisors={supervisorsForForm}
          canEditAllFields={loggedInUser?.role === 'ADMIN'} 
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}
