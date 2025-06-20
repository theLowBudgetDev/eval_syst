"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Employee, Supervisor } from "@/types";

// Zod schema for form validation
const employeeSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  department: z.string().min(1, "Department is required"),
  position: z.string().min(1, "Position is required"),
  hireDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  supervisorId: z.string().optional(),
  avatarUrl: z.string().url("Invalid URL for avatar").optional().or(z.literal('')),
});

type EmployeeFormData = z.infer<typeof employeeSchema>;

interface EmployeeFormProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  employee?: Employee | null;
  onSubmit: (data: Employee) => void;
  supervisors: Supervisor[];
}

export function EmployeeForm({
  isOpen,
  setIsOpen,
  employee,
  onSubmit,
  supervisors,
}: EmployeeFormProps) {
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: employee
      ? {
          name: employee.name,
          email: employee.email,
          department: employee.department,
          position: employee.position,
          hireDate: employee.hireDate,
          supervisorId: employee.supervisorId || "",
          avatarUrl: employee.avatarUrl || "",
        }
      : {
          name: "",
          email: "",
          department: "",
          position: "",
          hireDate: new Date().toISOString().split('T')[0], // Default to today
          supervisorId: "",
          avatarUrl: "",
        },
  });

  React.useEffect(() => {
    if (employee) {
      reset({
        name: employee.name,
        email: employee.email,
        department: employee.department,
        position: employee.position,
        hireDate: employee.hireDate,
        supervisorId: employee.supervisorId || "",
        avatarUrl: employee.avatarUrl || "",
      });
    } else {
      reset({
        name: "",
        email: "",
        department: "",
        position: "",
        hireDate: new Date().toISOString().split('T')[0],
        supervisorId: "",
        avatarUrl: "",
      });
    }
  }, [employee, reset, isOpen]);

  const handleFormSubmit = (data: EmployeeFormData) => {
    const supervisor = supervisors.find(s => s.id === data.supervisorId);
    const submissionData: Employee = {
      ...data,
      id: employee?.id || "", // ID will be handled by parent or backend
      supervisorName: supervisor?.name,
    };
    onSubmit(submissionData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px] md:sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{employee ? "Edit Employee" : "Add New Employee"}</DialogTitle>
          <DialogDescription>
            {employee ? "Update the employee's details." : "Fill in the details for the new employee."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="grid gap-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" {...register("name")} className="mt-1" />
              {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" {...register("email")} className="mt-1" />
              {errors.email && <p className="text-sm text-destructive mt-1">{errors.email.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="department">Department</Label>
              <Input id="department" {...register("department")} className="mt-1" />
              {errors.department && <p className="text-sm text-destructive mt-1">{errors.department.message}</p>}
            </div>
            <div>
              <Label htmlFor="position">Position</Label>
              <Input id="position" {...register("position")} className="mt-1" />
              {errors.position && <p className="text-sm text-destructive mt-1">{errors.position.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="hireDate">Hire Date</Label>
              <Input id="hireDate" type="date" {...register("hireDate")} className="mt-1" />
              {errors.hireDate && <p className="text-sm text-destructive mt-1">{errors.hireDate.message}</p>}
            </div>
            <div>
              <Label htmlFor="supervisorId">Supervisor</Label>
              <Controller
                name="supervisorId"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select a supervisor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No Supervisor</SelectItem>
                      {supervisors.map((sup) => (
                        <SelectItem key={sup.id} value={sup.id}>
                          {sup.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.supervisorId && <p className="text-sm text-destructive mt-1">{errors.supervisorId.message}</p>}
            </div>
          </div>
          <div>
              <Label htmlFor="avatarUrl">Avatar URL (Optional)</Label>
              <Input id="avatarUrl" {...register("avatarUrl")} className="mt-1" placeholder="https://placehold.co/100x100.png"/>
              {errors.avatarUrl && <p className="text-sm text-destructive mt-1">{errors.avatarUrl.message}</p>}
            </div>
          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">{employee ? "Save Changes" : "Add Employee"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
