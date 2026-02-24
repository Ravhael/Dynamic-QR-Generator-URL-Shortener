import { useAuth } from '../contexts/AuthContext';

const PermissionDetails = () => {
  const { 
    user, 
    isAdmin, 
    isEditor, 
    isViewer,
    canAccessUserManagement,
    canCreateResources,
    canModifyResource,
    canViewResource,
    getUserGroupId 
  } = useAuth();

  const isInGroup = (groupId: number) => {
    return getUserGroupId() === groupId;
  };

  if (!user) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Permission Details</h3>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">Not authenticated</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4">Permission Details</h3>
      
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium mb-3 text-gray-900">Role Permissions</h4>
            <div className="space-y-2 text-sm">
              <div className={`p-3 rounded-lg ${isAdmin() ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                <div className="flex items-center justify-between">
                  <span>Admin Access</span>
                  <span className="font-semibold">{isAdmin() ? '✅' : '❌'}</span>
                </div>
              </div>
              <div className={`p-3 rounded-lg ${isEditor() ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                <div className="flex items-center justify-between">
                  <span>Editor Access</span>
                  <span className="font-semibold">{isEditor() ? '✅' : '❌'}</span>
                </div>
              </div>
              <div className={`p-3 rounded-lg ${isViewer() ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                <div className="flex items-center justify-between">
                  <span>Viewer Access</span>
                  <span className="font-semibold">{isViewer() ? '✅' : '❌'}</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-3 text-gray-900">Department Access</h4>
            <div className="space-y-2 text-sm">
              <div className={`p-3 rounded-lg ${isInGroup(1) ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                <div className="flex items-center justify-between">
                  <span>DGM</span>
                  <span className="font-semibold">{isInGroup(1) ? '✅' : '❌'}</span>
                </div>
              </div>
              <div className={`p-3 rounded-lg ${isInGroup(2) ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                <div className="flex items-center justify-between">
                  <span>Marcomm</span>
                  <span className="font-semibold">{isInGroup(2) ? '✅' : '❌'}</span>
                </div>
              </div>
              <div className={`p-3 rounded-lg ${isInGroup(3) ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                <div className="flex items-center justify-between">
                  <span>HRD</span>
                  <span className="font-semibold">{isInGroup(3) ? '✅' : '❌'}</span>
                </div>
              </div>
              <div className={`p-3 rounded-lg ${isInGroup(4) ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                <div className="flex items-center justify-between">
                  <span>AM/GA</span>
                  <span className="font-semibold">{isInGroup(4) ? '✅' : '❌'}</span>
                </div>
              </div>
              <div className={`p-3 rounded-lg ${isInGroup(5) ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                <div className="flex items-center justify-between">
                  <span>ADMIN</span>
                  <span className="font-semibold">{isInGroup(5) ? '✅' : '❌'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-3 text-gray-900">System Permissions</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className={`p-3 rounded-lg ${canCreateResources() ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              <div className="flex items-center justify-between">
                <span>Create Resources</span>
                <span className="font-semibold">{canCreateResources() ? '✅' : '❌'}</span>
              </div>
            </div>
            <div className={`p-3 rounded-lg ${canAccessUserManagement() ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              <div className="flex items-center justify-between">
                <span>Manage Users</span>
                <span className="font-semibold">{canAccessUserManagement() ? '✅' : '❌'}</span>
              </div>
            </div>
            <div className={`p-3 rounded-lg ${canModifyResource(user.id) ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              <div className="flex items-center justify-between">
                <span>Edit Own Content</span>
                <span className="font-semibold">{canModifyResource(user.id) ? '✅' : '❌'}</span>
              </div>
            </div>
            <div className={`p-3 rounded-lg ${user ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              <div className="flex items-center justify-between">
                <span>View Department Data</span>
                <span className="font-semibold">{user ? '✅' : '❌'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PermissionDetails;
