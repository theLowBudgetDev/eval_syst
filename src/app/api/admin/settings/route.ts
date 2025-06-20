
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { headers } from 'next/headers';
import type { UserRoleType, SystemSetting, AuditActionType } from '@/types';

const GLOBAL_SETTINGS_ID = "global_settings";

// Helper function to get current user (placeholder - replace with your actual auth logic)
async function getCurrentUser(): Promise<{ id: string; role: UserRoleType } | null> {
  const userId = headers().get('X-User-Id');
  const userRole = headers().get('X-User-Role') as UserRoleType;
  if (userId && userRole === 'ADMIN') {
    return { id: userId, role: userRole };
  }
  return null;
}

export async function GET(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ message: 'Forbidden: You do not have permission to view settings.' }, { status: 403 });
    }

    let settings = await prisma.systemSetting.findUnique({
      where: { id: GLOBAL_SETTINGS_ID },
    });

    if (!settings) {
      // Create default settings if they don't exist
      settings = await prisma.systemSetting.create({
        data: {
          id: GLOBAL_SETTINGS_ID,
          appName: "EvalTrack",
          systemTheme: "system",
          maintenanceMode: false,
          notificationsEnabled: true,
          emailNotifications: true,
        },
      });
    }

    return NextResponse.json(settings);
  } catch (error: any) {
    console.error("Error fetching system settings:", error);
    return NextResponse.json({ message: 'Failed to fetch system settings', error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ message: 'Forbidden: You do not have permission to update settings.' }, { status: 403 });
    }

    const data = await request.json() as Partial<Omit<SystemSetting, 'id' | 'createdAt' | 'updatedAt'>>;
    
    const { appName, systemTheme, maintenanceMode, notificationsEnabled, emailNotifications } = data;

    const updateData: any = {};
    if (appName !== undefined) updateData.appName = appName;
    if (systemTheme !== undefined) updateData.systemTheme = systemTheme;
    if (maintenanceMode !== undefined) updateData.maintenanceMode = maintenanceMode;
    if (notificationsEnabled !== undefined) updateData.notificationsEnabled = notificationsEnabled;
    if (emailNotifications !== undefined) updateData.emailNotifications = emailNotifications;

    if (Object.keys(updateData).length === 0) {
        return NextResponse.json({ message: "No settings provided to update." }, { status: 400 });
    }

    const oldSettings = await prisma.systemSetting.findUnique({
      where: { id: GLOBAL_SETTINGS_ID }
    });

    const updatedSettings = await prisma.systemSetting.upsert({
      where: { id: GLOBAL_SETTINGS_ID },
      update: updateData,
      create: {
        id: GLOBAL_SETTINGS_ID,
        appName: appName ?? "EvalTrack",
        systemTheme: systemTheme ?? "system",
        maintenanceMode: maintenanceMode ?? false,
        notificationsEnabled: notificationsEnabled ?? true,
        emailNotifications: emailNotifications ?? true,
      },
    });

    // Audit logging
    const changesMade: any = {};
    if (oldSettings) {
        for (const key in updateData) {
            if (oldSettings[key as keyof SystemSetting] !== updateData[key]) {
                changesMade[key] = { oldValue: oldSettings[key as keyof SystemSetting], newValue: updateData[key] };
            }
        }
    } else { // Settings were created
        changesMade['initial_creation'] = updateData;
    }

    if (Object.keys(changesMade).length > 0) {
        await prisma.auditLog.create({
            data: {
                userId: currentUser.id,
                action: "SYSTEM_SETTINGS_UPDATE" as AuditActionType,
                targetType: "SystemSetting",
                targetId: GLOBAL_SETTINGS_ID,
                details: changesMade,
            },
        });
    }


    return NextResponse.json(updatedSettings);
  } catch (error: any) {
    console.error("Error updating system settings:", error);
    return NextResponse.json({ message: 'Failed to update system settings', error: error.message }, { status: 500 });
  }
}
