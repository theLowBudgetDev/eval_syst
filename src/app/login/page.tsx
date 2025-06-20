
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth, mockAuthUsers } from "@/contexts/AuthContext";
import type { AppUser } from "@/types";
import { useRouter } from "next/navigation";
import { LogIn, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function LoginPage() {
  const { login, user, isLoading: authIsLoading } = useAuth();
  const [selectedUserId, setSelectedUserId] = React.useState<string>("");
  const [isLoggingIn, setIsLoggingIn] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
    if (!authIsLoading && user) {
      // Redirect logic is now handled in AuthContext and AppContent
    }
  }, [user, authIsLoading, router]);

  const handleLogin = () => {
    if (!selectedUserId) {
        alert("Please select a user to login."); // Or use a toast
        return;
    }
    setIsLoggingIn(true);
    const userToLogin = mockAuthUsers.find(u => u.id === selectedUserId);
    if (userToLogin) {
      // Simulate API call delay
      setTimeout(() => {
        login(userToLogin);
        // No need to push route here, AuthContext handles it
        setIsLoggingIn(false);
      }, 500);
    } else {
      alert("Selected user not found."); // Or use a toast
      setIsLoggingIn(false);
    }
  };
  
  if (authIsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-muted/30 p-4">
        <Card className="w-full max-w-sm shadow-xl">
          <CardHeader className="text-center">
            <Skeleton className="h-12 w-12 rounded-full mx-auto mb-4" />
            <Skeleton className="h-8 w-3/4 mx-auto mb-2" />
            <Skeleton className="h-4 w-1/2 mx-auto" />
          </CardHeader>
          <CardContent className="space-y-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // If user is already logged in, AppContent will handle redirection or show content
  // So this check is mostly for when JS is disabled or router hasn't caught up
  if (user && !authIsLoading) {
     return (
        <div className="flex items-center justify-center min-h-screen bg-muted/30 p-4">
            <p>Redirecting...</p>
        </div>
     );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/30 p-4">
      <Card className="w-full max-w-sm shadow-xl border-border">
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
            <Select value={selectedUserId} onValueChange={setSelectedUserId} disabled={isLoggingIn}>
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
          <Button type="button" className="w-full" onClick={handleLogin} disabled={!selectedUserId || isLoggingIn}>
            {isLoggingIn ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
            ) : (
                <LogIn className="mr-2 h-4 w-4" />
            )}
            {isLoggingIn ? "Logging in..." : "Login"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
