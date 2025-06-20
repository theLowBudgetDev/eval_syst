
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth, mockAuthUsers } from "@/contexts/AuthContext"; // mockAuthUsers for selection
import type { AppUser } from "@/types"; // Using AppUser
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";

export default function LoginPage() {
  const { login, user, isLoading } = useAuth();
  const [selectedUserId, setSelectedUserId] = React.useState<string>("");
  const router = useRouter();

  React.useEffect(() => {
    if (!isLoading && user) {
      if (user.role === "ADMIN") router.push("/");
      else if (user.role === "SUPERVISOR") router.push("/supervisor-dashboard");
      else router.push("/employee-dashboard");
    }
  }, [user, isLoading, router]);

  const handleLogin = () => {
    const userToLogin = mockAuthUsers.find(u => u.id === selectedUserId);
    if (userToLogin) {
      // The mockAuthUsers are already AppUser type with uppercase roles
      login(userToLogin);
    } else {
      alert("Please select a user to login.");
    }
  };
  
  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }
  
  if (user && !isLoading) {
     return <div className="flex justify-center items-center h-screen">Redirecting...</div>;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/30 p-4">
      <Card className="w-full max-w-sm shadow-xl">
        <CardHeader className="text-center">
           <div className="flex justify-center mb-4">
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-12 w-12 text-primary"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg>
           </div>
          <CardTitle className="text-2xl font-bold font-headline">Welcome to EvalTrack</CardTitle>
          <CardDescription>Please select a user profile to continue.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="user-select">Select User (Simulated Login)</Label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger id="user-select">
                <SelectValue placeholder="Select a user role" />
              </SelectTrigger>
              <SelectContent>
                {mockAuthUsers.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name} ({u.role.charAt(0).toUpperCase() + u.role.slice(1).toLowerCase()})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="button" className="w-full" onClick={handleLogin} disabled={!selectedUserId}>
            <LogIn className="mr-2 h-4 w-4" /> Login
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
