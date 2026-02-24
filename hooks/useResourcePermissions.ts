import { useEffect, useState } from 'react';
import { useAuth } from '@/components/contexts/AuthContext';

export interface ResourcePermissions {
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canManage: boolean;
}

export interface UseResourcePermissionsOptions {
  resourceType: 'qr_codes' | 'urls' | 'users' | 'groups' | 'analytics' | 'system';
  resourceId?: number;
  resourceOwnerId?: number;
  resourceGroupId?: number;
}

// Helper function to check permissions via API
async function checkPermissionAPI(
  resourceType: string,
  permissionType: string,
  resourceOwnerId?: number,
  resourceGroupId?: number
): Promise<boolean> {
  try {
    const response = await fetch('/api/permissions/check', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        resourceType,
        permissionType,
        resourceOwnerId,
        resourceGroupId,
      }),
    });

    if (response.status === 401) {
      // User not authenticated
      return false;
    }

    if (!response.ok) {
      console.error('Permission check failed:', response.statusText);
      return false;
    }

    const result = await response.json();
    return result.hasPermission || false;
  } catch (_error) {
    console.error('Permission check _error:', _error);
    return false;
  }
}

/**
 * Hook to check user permissions for a specific resource type
 * Returns permission flags for CRUD and management operations
 */
export function useResourcePermissions({
  resourceType,
  resourceId,
  resourceOwnerId,
  resourceGroupId
}: UseResourcePermissionsOptions): ResourcePermissions & { loading: boolean; _error: string | null } {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<ResourcePermissions>({
    canCreate: false,
    canRead: false,
    canUpdate: false,
    canDelete: false,
    canManage: false,
  });
  const [loading, setLoading] = useState(true);
  const [_error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkResourcePermissions() {
      if (!user?.id || !user?.role) {
        setPermissions({
          canCreate: false,
          canRead: false,
          canUpdate: false,
          canDelete: false,
          canManage: false,
        });
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Check all permission types
        const [canCreate, canRead, canUpdate, canDelete, canManage] = await Promise.all([
          checkPermissionAPI(resourceType, 'create', resourceOwnerId, resourceGroupId),
          checkPermissionAPI(resourceType, 'read', resourceOwnerId, resourceGroupId),
          checkPermissionAPI(resourceType, 'update', resourceOwnerId, resourceGroupId),
          checkPermissionAPI(resourceType, 'delete', resourceOwnerId, resourceGroupId),
          checkPermissionAPI(resourceType, 'manage', resourceOwnerId, resourceGroupId),
        ]);

        setPermissions({
          canCreate,
          canRead,
          canUpdate,
          canDelete,
          canManage,
        });
      } catch (_err) {
        console.error('[useResourcePermissions] Error checking permissions:', _err);
        setError('Failed to check permissions');
        setPermissions({
          canCreate: false,
          canRead: false,
          canUpdate: false,
          canDelete: false,
          canManage: false,
        });
      } finally {
        setLoading(false);
      }
    }

    checkResourcePermissions();
  }, [user?.id, user?.role, resourceType, resourceId, resourceOwnerId, resourceGroupId]);

  return {
    ...permissions,
    loading,
    _error,
  };
}

/**
 * Hook specifically for QR Code permissions
 */
export function useQRCodePermissions(qrCodeId?: number, ownerId?: number, groupId?: number) {
  return useResourcePermissions({
    resourceType: 'qr_codes',
    resourceId: qrCodeId,
    resourceOwnerId: ownerId,
    resourceGroupId: groupId,
  });
}

/**
 * Hook specifically for Short URL permissions
 */
export function useShortURLPermissions(urlId?: number, ownerId?: number, groupId?: number) {
  return useResourcePermissions({
    resourceType: 'urls',
    resourceId: urlId,
    resourceOwnerId: ownerId,
    resourceGroupId: groupId,
  });
}

/**
 * Hook specifically for User management permissions
 */
export function useUserPermissions(userId?: number, ownerId?: number, groupId?: number) {
  return useResourcePermissions({
    resourceType: 'users',
    resourceId: userId,
    resourceOwnerId: ownerId,
    resourceGroupId: groupId,
  });
}

/**
 * Hook specifically for Group management permissions
 */
export function useGroupPermissions(groupId?: number, ownerId?: number) {
  return useResourcePermissions({
    resourceType: 'groups',
    resourceId: groupId,
    resourceOwnerId: ownerId,
  });
}

/**
 * Hook specifically for Analytics permissions
 */
export function useAnalyticsPermissions() {
  return useResourcePermissions({
    resourceType: 'analytics',
  });
}

/**
 * Hook specifically for System management permissions
 */
export function useSystemPermissions() {
  return useResourcePermissions({
    resourceType: 'system',
  });
}

/**
 * Utility hook to check a single permission quickly
 */
export function useSinglePermission(
  resourceType: UseResourcePermissionsOptions['resourceType'],
  permissionType: 'create' | 'read' | 'update' | 'delete' | 'manage',
  resourceOwnerId?: number,
  resourceGroupId?: number
): { hasPermission: boolean; loading: boolean; _error: string | null } {
  const { user } = useAuth();
  const [hasPermission, setHasPermission] = useState(false);
  const [loading, setLoading] = useState(true);
  const [_error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkSinglePermission() {
      if (!user?.id || !user?.role) {
        setHasPermission(false);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const permission = await checkPermissionAPI(
          resourceType,
          permissionType,
          resourceOwnerId,
          resourceGroupId
        );

        setHasPermission(permission);
      } catch (_err) {
        console.error('[useSinglePermission] Error checking permission:', _err);
        setError('Failed to check permission');
        setHasPermission(false);
      } finally {
        setLoading(false);
      }
    }

    checkSinglePermission();
  }, [user?.id, user?.role, resourceType, permissionType, resourceOwnerId, resourceGroupId]);

  return {
    hasPermission,
    loading,
    _error,
  };
}
