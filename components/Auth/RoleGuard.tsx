import React, { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles?: ('admin' | 'editor' | 'viewer')[];
  requireAdmin?: boolean;
  requireEditor?: boolean;
  fallback?: ReactNode;
  onUnauthorized?: () => void;
}

/**
 * Component untuk mengontrol akses berdasarkan role user
 * 
 * @param children - Content yang akan ditampilkan jika user memiliki akses
 * @param allowedRoles - Array role yang diizinkan mengakses content
 * @param requireAdmin - Hanya admin yang bisa mengakses
 * @param requireEditor - Minimal editor yang bisa mengakses (admin + editor)
 * @param fallback - Content alternatif jika user tidak memiliki akses
 * @param onUnauthorized - Callback yang dipanggil saat user tidak memiliki akses
 */
export const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  allowedRoles,
  requireAdmin = false,
  requireEditor = false,
  fallback = null,
  onUnauthorized
}) => {
  const { user } = useAuth();
  const isAdmin = () => user?.role === 'ADMIN'
  const isEditor = () => user?.role === 'EDITOR' || isAdmin()
  const isViewer = () => user?.role === 'USER' || isEditor()

  if (!user) {
    onUnauthorized?.();
    return <>{fallback}</>;
  }

  let hasAccess = false;

  if (requireAdmin) {
    hasAccess = isAdmin();
  } else if (requireEditor) {
    hasAccess = isAdmin() || isEditor();
  } else if (allowedRoles) {
    hasAccess = allowedRoles.some(role => {
      switch (role) {
        case 'admin':
          return isAdmin();
        case 'editor':
          return isEditor();
        case 'viewer':
          return isViewer();
        default:
          return false;
      }
    });
  } else {
    // Jika tidak ada kriteria khusus, izinkan semua user yang login
    hasAccess = true;
  }

  if (!hasAccess) {
    onUnauthorized?.();
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

interface ResourceGuardProps {
  children: ReactNode;
  resourceOwnerId: string;
  resourceGroupId?: number;
  requireOwnership?: boolean;
  fallback?: ReactNode;
  onUnauthorized?: () => void;
}

/**
 * Component untuk mengontrol akses berdasarkan kepemilikan resource
 * 
 * @param children - Content yang akan ditampilkan jika user memiliki akses
 * @param resourceOwnerId - ID owner dari resource
 * @param resourceGroupId - ID group dari resource (opsional)
 * @param requireOwnership - Hanya owner yang bisa mengakses (tidak termasuk group access)
 * @param fallback - Content alternatif jika user tidak memiliki akses
 * @param onUnauthorized - Callback yang dipanggil saat user tidak memiliki akses
 */
export const ResourceGuard: React.FC<ResourceGuardProps> = ({
  children,
  resourceOwnerId,
  resourceGroupId,
  requireOwnership = false,
  fallback = null,
  onUnauthorized
}) => {
  const { user } = useAuth();
  const isAdmin = () => user?.role === 'ADMIN'
  const canModifyResource = (resourceOwnerId: string) => {
    if (isAdmin()) return true
    return user?.id === resourceOwnerId
  }
  const canViewResource = (resourceOwnerId: string, resourceGroupId?: number) => {
    if (isAdmin()) return true
    if (user?.id === resourceOwnerId) return true
    if (resourceGroupId && user?.group_id === resourceGroupId) return true
    return false
  }

  if (!user) {
    onUnauthorized?.();
    return <>{fallback}</>;
  }

  let hasAccess = false;

  if (requireOwnership) {
    // Hanya owner atau admin yang bisa mengakses
    hasAccess = isAdmin() || canModifyResource(resourceOwnerId);
  } else {
    // Akses berdasarkan group + ownership
    hasAccess = canViewResource(resourceOwnerId, resourceGroupId);
  }

  if (!hasAccess) {
    onUnauthorized?.();
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

interface ConditionalRenderProps {
  children: ReactNode;
  condition: () => boolean;
  fallback?: ReactNode;
}

/**
 * Component untuk conditional rendering berdasarkan function
 */
export const ConditionalRender: React.FC<ConditionalRenderProps> = ({
  children,
  condition,
  fallback = null
}) => {
  return condition() ? <>{children}</> : <>{fallback}</>;
};

// Hook untuk authorization checks
export const useAuthorization = () => {
  const auth = useAuth();
  const isAdmin = () => auth.user?.role === 'ADMIN'
  const isEditor = () => auth.user?.role === 'EDITOR' || isAdmin()
  const isViewer = () => auth.user?.role === 'USER' || isEditor()

  return {
    ...auth,
    
    // Quick access helpers
    isAdminUser: isAdmin(),
    isEditorUser: isEditor(),
    isViewerUser: isViewer(),
    canCreateContent: isEditor() || isAdmin(),
    canManageUsers: isAdmin(),
    
    // Resource-specific helpers
    canEdit: (resourceOwnerId: string) => (isAdmin() || auth.user?.id === resourceOwnerId),
    canView: (resourceOwnerId: string, resourceGroupId?: number) => {
      if (isAdmin() || isEditor()) return true
      if (auth.user?.id === resourceOwnerId) return true
      if (resourceGroupId && auth.user?.group_id === resourceGroupId) return true
      return false
    },
  };
};
