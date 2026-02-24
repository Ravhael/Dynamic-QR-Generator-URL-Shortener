import React from 'react';
import { useAuth } from '../contexts/AuthContext';

export const RoleSelector: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();

  const handleRoleChange = (_role: 'admin' | 'editor' | 'viewer') => {
    // In real app, role changes happen via server/admin. Placeholder UI only.
    console.info('Role change requested:', _role)
  };

  if (!isAuthenticated) {
    return (
      <div className="bg-white p-4 rounded-lg shadow border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Demo Authentication
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Select a role to test authorization features:
        </p>
        <div className="flex flex-col space-y-2">
          <button
            onClick={() => handleRoleChange('admin')}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Login as Admin (Full Access)
          </button>
          <button
            onClick={() => handleRoleChange('editor')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Login as Editor (Group 2)
          </button>
          <button
            onClick={() => handleRoleChange('viewer')}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
          >
            Login as Viewer (Group 2)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow border">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Current User
      </h3>
      <div className="text-sm text-gray-600 space-y-1">
        <p><strong>Name:</strong> {user?.name}</p>
        <p><strong>Email:</strong> {user?.email}</p>
        <p>
          <strong>Role:</strong> 
          <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
            user?.role === 'admin' ? 'bg-red-100 text-red-800' :
            user?.role === 'editor' ? 'bg-blue-100 text-blue-800' :
            'bg-green-100 text-green-800'
          }`}>
            {user?.role?.toUpperCase()}
          </span>
        </p>
        <p><strong>Group:</strong> No Group</p>
      </div>
      
      <div className="mt-4 flex flex-col space-y-2">
        <div className="flex space-x-2">
          <button
            onClick={() => handleRoleChange('admin')}
            disabled={user?.role === 'admin'}
            className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Switch to Admin
          </button>
          <button
            onClick={() => handleRoleChange('editor')}
            disabled={user?.role === 'editor'}
            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Switch to Editor
          </button>
          <button
            onClick={() => handleRoleChange('viewer')}
            disabled={user?.role === 'viewer'}
            className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Switch to Viewer
          </button>
        </div>
        <button
          onClick={logout}
          className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 transition-colors"
        >
          Logout
        </button>
      </div>
    </div>
  );
};
