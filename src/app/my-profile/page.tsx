
"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Edit, Loader2 } from "lucide-react";
import { EmployeeForm } from "@/components/employees/EmployeeForm";
import type { AppUser } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function MyProfilePage() {
  const { user: loggedInUser, isLoading: authIsLoading, login: updateAuthContextUser } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [isFetchingSupervisors, setIsFetchingSupervisors] = React.useState(false);
  const [supervisorsForForm, setSupervisorsForForm] = React.useState<AppUser[]>([]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  // User details might update, so store a local copy for the page display
  const [currentUserDetails, setCurrentUserDetails] = React.useState<AppUser | null>(loggedInUser);

  React.useEffect(() => {
    if (!authIsLoading && !loggedInUser) {
      router.push('/login');
    } else if (loggedInUser) {
        setCurrentUserDetails(loggedInUser); // Keep local state in sync with auth context
    }
  }, [loggedInUser, authIsLoading, router]);

  const fetchSupervisors = async () => {
    if (loggedInUser?.role !== 'ADMIN') { // Only admin form needs supervisors list
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
    if (loggedInUser?.role === 'ADMIN') { // Only fetch supervisors if admin might change them
        fetchSupervisors(); 
    }
    setIsFormOpen(true);
  }

  const handleFormSubmit = async (employeeData: AppUser) => {
    if (!loggedInUser || employeeData.id !== loggedInUser.id) {
        toast({ title: "Error", description: "Invalid operation. Cannot update profile.", variant: "destructive"});
        return;
    }
    setIsSubmitting(true);
    
    const payload = { ...employeeData }; 
    // Ensure hireDate is in 'YYYY-MM-DD' format if it's coming from a date picker that might add time
    if (payload.hireDate && payload.hireDate.includes('T')) {
        payload.hireDate = payload.hireDate.split('T')[0];
    }
    // For self-edit, role and supervisorId should not be changed by non-admins.
    // The API should enforce this, but we can also restrict payload here.
    if (loggedInUser.role !== 'ADMIN') {
        delete (payload as any).role;
        delete (payload as any).supervisorId;
        // Non-admins likely can only change avatar and maybe name/email (API dependent)
        // For now, EmployeeForm with canEditAllFields=false handles UI restriction.
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
        const updatedUserFromApi: AppUser = await res.json();
        updateAuthContextUser(updatedUserFromApi); // Update user in AuthContext and localStorage
        setCurrentUserDetails(updatedUserFromApi); // Update local display state
        toast({ title: "Profile Updated", description: "Your details have been successfully updated."});
        setIsFormOpen(false);
    } catch (error) {
        toast({ title: "Update Failed", description: (error as Error).message, variant: "destructive"});
    } finally {
        setIsSubmitting(false);
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
