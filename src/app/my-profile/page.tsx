
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
import { mockSupervisors } from "@/lib/mockData"; // To pass to form
import type { Employee } from "@/types";
import { useToast } from "@/hooks/use-toast";


export default function MyProfilePage() {
  const { user, isLoading, login } = useAuth(); // Use login to update user state after edit
  const router = useRouter();
  const { toast } = useToast();
  
  const [isFormOpen, setIsFormOpen] = React.useState(false);

  React.useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return <div className="flex justify-center items-center h-screen">Loading profile...</div>;
  }
  
  const handleFormSubmit = (employeeData: Employee) => {
    // In a real app, this would send to a backend.
    // Here, we update the AuthContext's user state and localStorage.
    if (user && employeeData.id === user.id) {
        const updatedUser = { ...user, ...employeeData, role: user.role }; // ensure role is preserved
        login(updatedUser); // This updates context and localStorage
        toast({ title: "Profile Updated", description: "Your details have been updated."});
    }
    setIsFormOpen(false);
  };


  return (
    <div className="space-y-6">
      <PageHeader
        title="My Profile"
        description="View and manage your personal information."
        actions={
            <Button onClick={() => setIsFormOpen(true)}>
                <Edit className="mr-2 h-4 w-4" /> Edit Profile
            </Button>
        }
      />

      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user.avatarUrl} alt={user.name} data-ai-hint="person face"/>
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
              <p>{user.supervisorName || "N/A"}</p>
            </div>
             <div>
              <Label className="text-muted-foreground">Role</Label>
              <p className="capitalize">{user.role}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {isFormOpen && user && (
        <EmployeeForm
          isOpen={isFormOpen}
          setIsOpen={setIsFormOpen}
          employee={user} // Pass the current user as the employee to edit
          onSubmit={handleFormSubmit}
          supervisors={mockSupervisors}
          canEditAllFields={false} // Employee can't edit all fields, only specific ones like avatar
        />
      )}
    </div>
  );
}
