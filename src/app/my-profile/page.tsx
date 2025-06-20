
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
import { Edit } from "lucide-react";
import { EmployeeForm } from "@/components/employees/EmployeeForm";
import type { AppUser } from "@/types";
import { useToast } from "@/hooks/use-toast";

export default function MyProfilePage() {
  const { user, isLoading, login: updateAuthContextUser } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [supervisorsForForm, setSupervisorsForForm] = React.useState<AppUser[]>([]);
  const [isFetchingSupervisors, setIsFetchingSupervisors] = React.useState(false);

  React.useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  // Fetch supervisors if the form might be opened (relevant if user can change their supervisor, usually not for "My Profile")
  // Or if form needs it for display (less likely for self-profile view before edit)
  const fetchSupervisors = async () => {
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
    fetchSupervisors(); // Fetch supervisors when opening the form
    setIsFormOpen(true);
  }

  if (isLoading || !user) {
    return <div className="flex justify-center items-center h-screen">Loading profile...</div>;
  }
  
  const handleFormSubmit = async (employeeData: AppUser) => {
    if (!user || employeeData.id !== user.id) {
        toast({ title: "Error", description: "Invalid operation.", variant: "destructive"});
        return;
    }

    // User should only be able to update certain fields from "My Profile"
    // The EmployeeForm's canEditAllFields=false already restricts UI,
    // but API should also enforce this. Here we assume API handles it.
    // We only send fields that are typically self-editable, e.g., avatarUrl
    // Or if EmployeeForm is smart enough to only submit changed allowed fields.
    // For now, we'll PUT the whole `employeeData` from form (which might include unchanged fields)
    // and rely on `canEditAllFields` to have restricted what user could input.
    
    const payload = { ...employeeData, hireDate: employeeData.hireDate.split('T')[0] };


    try {
        const res = await fetch(`/api/users/${user.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || "Failed to update profile");
        }
        const updatedUserFromApi = await res.json();
        updateAuthContextUser(updatedUserFromApi); // Update user in AuthContext and localStorage
        toast({ title: "Profile Updated", description: "Your details have been updated."});
        setIsFormOpen(false);
    } catch (error) {
        toast({ title: "Update Failed", description: (error as Error).message, variant: "destructive"});
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Profile"
        description="View and manage your personal information."
        actions={
            <Button onClick={handleOpenEditForm} disabled={isFetchingSupervisors}>
                <Edit className="mr-2 h-4 w-4" /> Edit Profile
            </Button>
        }
      />

      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user.avatarUrl || undefined} alt={user.name} data-ai-hint="person face"/>
              <AvatarFallback>{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-3xl">{user.name}</CardTitle>
              <CardDescription className="text-lg">{user.position}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
            <div>
              <Label className="text-muted-foreground">Email Address</Label>
              <p>{user.email}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Department</Label>
              <div><Badge variant="secondary">{user.department}</Badge></div>
            </div>
            <div>
              <Label className="text-muted-foreground">Hire Date</Label>
              <p>{format(new Date(user.hireDate), "MMMM d, yyyy")}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Supervisor</Label>
              <p>{user.supervisor?.name || "N/A"}</p>
            </div>
             <div>
              <Label className="text-muted-foreground">Role</Label>
              <p className="capitalize">{user.role.toLowerCase()}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {isFormOpen && user && (
        <EmployeeForm
          isOpen={isFormOpen}
          setIsOpen={setIsFormOpen}
          employee={user} 
          onSubmit={handleFormSubmit}
          supervisors={supervisorsForForm} // Pass fetched supervisors
          canEditAllFields={user.role === 'ADMIN'} // Only admin can edit all fields, user can edit limited (e.g. avatar)
        />
      )}
    </div>
  );
}
