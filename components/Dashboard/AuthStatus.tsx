import { useAuth } from '../contexts/AuthContext';

const AuthStatus = () => {
  const { user } = useAuth();

  const formatGroupName = (groupId: number) => {
    const groups = {
      1: 'DGM',
      2: 'Marcomm',
      3: 'HRD',
      4: 'AM/GA',
      5: 'ADMIN'
    };
    return groups[groupId as keyof typeof groups] || `Group ${groupId}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4">Authorization Status</h3>
      
      {user ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-700">
            <strong>Logged in as:</strong> {user.name} ({user.email})
          </p>
          <p className="text-sm text-green-700">
            <strong>Role:</strong> {user.role}
          </p>
          <p className="text-sm text-green-700">
            <strong>Department:</strong> No Department
          </p>
        </div>
      ) : (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">Not authenticated</p>
        </div>
      )}
    </div>
  );
};

export default AuthStatus;
