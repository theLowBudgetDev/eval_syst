
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
import type { AppUser, UserRoleType } from "@/types";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const NO_SUPERVISOR_VALUE = "--NONE--"; 
const USER_ROLES_OPTIONS: UserRoleType[] = ['ADMIN', 'SUPERVISOR', 'EMPLOYEE'];

const employeeFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  department: z.string().min(1, "Department is required"),
  position: z.string().min(1, "Position is required"),
  hireDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  role: z.enum(USER_ROLES_OPTIONS, { errorMap: () => ({ message: "Invalid role" }) }),
  supervisorId: z.string().optional().nullable(),
  avatarUrl: z.string().url("Invalid URL for avatar, ensure it includes http(s)://").optional().or(z.literal('')).nullable(),
  avatarFile: z.instanceof(File).optional().nullable(),
  password: z.string().min(8, "Password must be at least 8 characters").optional().or(z.literal('')),
});

type EmployeeFormData = z.infer<typeof employeeFormSchema>;

interface EmployeeFormProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  employee?: AppUser | null;
  onSubmit: (data: Partial<AppUser> & { password?: string }, isEditing: boolean, avatarFile?: File | null) => Promise<void>;
  supervisors: AppUser[];
  canEditAllFields?: boolean;
  isSubmitting: boolean;
}

export function EmployeeForm({
  isOpen,
  setIsOpen,
  employee,
  onSubmit,
  supervisors,
  canEditAllFields = false,
  isSubmitting,
}: EmployeeFormProps) {
  const { user: loggedInUser } = useAuth();
  const isEditingSelf = !!employee && employee.id === loggedInUser?.id;
  const [selectedAvatarFile, setSelectedAvatarFile] = React.useState<File | null>(null);
  const avatarFileRef = React.useRef<HTMLInputElement>(null);
  const [showPassword, setShowPassword] = React.useState(false);

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
    setValue,
    watch
  } = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: {
      name: "",
      email: "",
      department: "",
      position: "",
      hireDate: new Date().toISOString().split('T')[0],
      role: "EMPLOYEE",
      supervisorId: NO_SUPERVISOR_VALUE,
      avatarUrl: "",
      avatarFile: null,
      password: "",
    },
  });

  const currentAvatarUrl = watch("avatarUrl");

  React.useEffect(() => {
    if (isOpen) {
      setSelectedAvatarFile(null);
      if (avatarFileRef.current) {
        avatarFileRef.current.value = "";
      }
      if (employee) {
        reset({
          name: employee.name,
          email: employee.email,
          department: employee.department,
          position: employee.position,
          hireDate: employee.hireDate.split('T')[0],
          role: employee.role,
          supervisorId: employee.supervisorId || NO_SUPERVISOR_VALUE,
          avatarUrl: employee.avatarUrl || "",
          avatarFile: null,
          password: "",
        });
      } else {
        reset({
          name: "",
          email: "",
          department: "",
          position: "",
          hireDate: new Date().toISOString().split('T')[0],
          role: "EMPLOYEE",
          supervisorId: NO_SUPERVISOR_VALUE,
          avatarUrl: "",
          avatarFile: null,
          password: "",
        });
      }
    }
  }, [employee, reset, isOpen]);

  const handleFormInternalSubmit = (data: EmployeeFormData) => {
    if (!employee && !data.password) {
      alert("Password is required for new employees.");
      return;
    }
    
    const submissionData: Partial<AppUser> & { password?: string } = {
      id: employee?.id || undefined,
      name: data.name,
      email: data.email,
      department: data.department,
      position: data.position,
      hireDate: data.hireDate,
      role: data.role,
      avatarUrl: selectedAvatarFile ? "" : data.avatarUrl || null,
      supervisorId: data.supervisorId === NO_SUPERVISOR_VALUE ? null : data.supervisorId,
    };

    if (!employee && data.password) {
      submissionData.password = data.password;
    }

    onSubmit(submissionData, !!employee, selectedAvatarFile);
  };

  const coreFieldReadOnly = !canEditAllFields && !!employee && !isEditingSelf;
  const roleFieldReadOnly = !canEditAllFields;
  const supervisorFieldReadOnly = !canEditAllFields && !!employee;
  const avatarFieldChangeAllowed = canEditAllFields || isEditingSelf;


  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px] md:sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{employee ? "Edit Employee" : "Add New Employee"}</DialogTitle>
          <DialogDescription>
            {employee ? "Update employee details." : "Fill in details for the new employee."}
            {isEditingSelf && !canEditAllFields && <span className="block text-xs mt-1">You can update your avatar. Contact an admin for other changes.</span>}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormInternalSubmit)} className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" {...register("name")} className="mt-1" readOnly={coreFieldReadOnly} />
              {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" {...register("email")} className="mt-1" readOnly={coreFieldReadOnly}/>
              {errors.email && <p className="text-sm text-destructive mt-1">{errors.email.message}</p>}
            </div>
          </div>

          {!employee && (
            <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                    <Input id="password" type={showPassword ? 'text' : 'password'} {...register("password")} className="mt-1 pr-10" />
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute inset-y-0 right-0 h-full px-3 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowPassword(!showPassword)}
                    >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                </div>
                {errors.password && <p className="text-sm text-destructive mt-1">{errors.password.message}</p>}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="department">Department</Label>
              <Input id="department" {...register("department")} className="mt-1" readOnly={coreFieldReadOnly} />
              {errors.department && <p className="text-sm text-destructive mt-1">{errors.department.message}</p>}
            </div>
            <div>
              <Label htmlFor="position">Position</Label>
              <Input id="position" {...register("position")} className="mt-1" readOnly={coreFieldReadOnly} />
              {errors.position && <p className="text-sm text-destructive mt-1">{errors.position.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="hireDate">Hire Date</Label>
              <Input id="hireDate" type="date" {...register("hireDate")} className="mt-1" readOnly={coreFieldReadOnly} />
              {errors.hireDate && <p className="text-sm text-destructive mt-1">{errors.hireDate.message}</p>}
            </div>
            <div>
              <Label htmlFor="role">Role</Label>
              <Controller
                name="role"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={roleFieldReadOnly || isSubmitting}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      {USER_ROLES_OPTIONS.map((roleValue) => (
                        <SelectItem key={roleValue} value={roleValue}>
                          {roleValue.charAt(0) + roleValue.slice(1).toLowerCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.role && <p className="text-sm text-destructive mt-1">{errors.role.message}</p>}
            </div>
          </div>

           <div>
              <Label htmlFor="supervisorId">Supervisor</Label>
              <Controller
                name="supervisorId"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value || NO_SUPERVISOR_VALUE}
                    onValueChange={(value) => {
                      field.onChange(value === NO_SUPERVISOR_VALUE ? null : value);
                    }}
                    disabled={supervisorFieldReadOnly || isSubmitting}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select a supervisor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_SUPERVISOR_VALUE}>No Supervisor</SelectItem>
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

          <div>
            <Label htmlFor="avatarFile">Avatar Image</Label>
            <Input
              id="avatarFile"
              type="file"
              accept="image/*"
              className="mt-1 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
              ref={avatarFileRef}
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                setSelectedAvatarFile(file);
                setValue("avatarFile", file, { shouldValidate: true });
                if (file) setValue("avatarUrl", "");
              }}
              disabled={!avatarFieldChangeAllowed || isSubmitting}
            />
            {selectedAvatarFile && <p className="text-xs text-muted-foreground mt-1">Selected: {selectedAvatarFile.name}</p>}
            {!selectedAvatarFile && currentAvatarUrl && <p className="text-xs text-muted-foreground mt-1">Current: <a href={currentAvatarUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">View Image</a></p>}
            {errors.avatarFile && <p className="text-sm text-destructive mt-1">{errors.avatarFile.message}</p>}
            {errors.avatarUrl && !selectedAvatarFile && <p className="text-sm text-destructive mt-1">{errors.avatarUrl.message}</p>}
             <p className="text-xs text-muted-foreground mt-1">Or provide an image URL (e.g., from Gravatar, company directory):</p>
            <Input
              id="avatarUrl"
              {...register("avatarUrl")}
              className="mt-1"
              placeholder="https://placehold.co/100x100.png"
              disabled={!avatarFieldChangeAllowed || isSubmitting || !!selectedAvatarFile}
            />

          </div>


          <DialogFooter className="mt-4 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || (!isDirty && !!employee && !selectedAvatarFile) || (isEditingSelf && !canEditAllFields && !isDirty && !selectedAvatarFile)}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isSubmitting ? (employee ? "Saving..." : "Adding...") : (employee ? "Save Changes" : "Add Employee")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
