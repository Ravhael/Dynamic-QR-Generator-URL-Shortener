import { InformationCircleIcon, PencilIcon, PlusIcon, TrashIcon, UsersIcon } from "@heroicons/react/24/outline"

import React, { useEffect, useState } from "react";
import groupService from "../../app/api/groupService";
// import { PlusIcon, PencilIcon, TrashIcon, UsersIcon, InformationCircleIcon } - unused import from '@heroicons/react/24/outline';

interface Group {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export const Groups: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "" });

  // Ambil data group saat pertama kali
  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      const res = await groupService.getGroups();
      setGroups(res.data);
    } catch (_err) {
      console.error("Failed to load groups:", _err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingGroup) {
        await groupService.updateGroup(editingGroup.id, formData);
      } else {
        await groupService.createGroup(formData);
      }
      setFormData({ name: "", description: "" });
      setEditingGroup(null);
      await loadGroups();
    } catch (_err) {
      console.error("Failed to save group:", _err);
    }
  };

  const handleEdit = (group: Group) => {
    setEditingGroup(group);
    setFormData({ name: group.name, description: group.description || "" });
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Yakin ingin menghapus group ini?")) return;
    try {
      await groupService.deleteGroup(id);
      await loadGroups();
    } catch (_err) {
      console.error("Failed to delete group:", _err);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-50 to-gray-100 flex items-center justify-center">
      <div className="bg-white/90  rounded-2xl p-8 border border-white/30 shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 border-4 border-gray-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-700 font-medium">Loading groups...</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-r from-gray-600 to-gray-700 p-4 rounded-2xl shadow-lg">
              <UsersIcon className="h-10 w-10 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-600 to-gray-700 bg-clip-text text-transparent mb-2">
            Group Management
          </h1>
          <p className="text-gray-600 text-lg">
            Manage user groups and permissions
          </p>
        </div>

        {/* Form Tambah/Edit */}
        <div className="bg-white/90  rounded-2xl p-8 border border-white/30 shadow-xl">
          <div className="flex items-center space-x-3 mb-6">
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-2 rounded-lg">
              <PlusIcon className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">
              {editingGroup ? "Edit Group" : "Create New Group"}
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Group Name *
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-white/90  border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-300 text-gray-800 placeholder-gray-500"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter group name"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Description
                </label>
                <textarea
                  rows={3}
                  className="w-full px-4 py-3 bg-white/90  border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-300 text-gray-800 placeholder-gray-500 resize-none"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter group description"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white font-medium rounded-xl hover:from-gray-700 hover:to-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                <PlusIcon className="w-5 h-5 mr-2" />
                {editingGroup ? "Update Group" : "Create Group"}
              </button>
              
              {editingGroup && (
                <button
                  type="button"
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white font-medium rounded-xl hover:from-gray-600 hover:to-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-300 transform hover:scale-105 shadow-lg"
                  onClick={() => {
                    setEditingGroup(null);
                    setFormData({ name: "", description: "" });
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Tabel List Group */}
        <div className="bg-white/90  rounded-2xl border border-white/30 shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-gray-600 to-gray-700 p-6">
            <h3 className="text-xl font-bold text-white flex items-center">
              <UsersIcon className="w-6 h-6 mr-3" />
              Groups List ({groups.length})
            </h3>
          </div>

          {groups.length === 0 ? (
            <div className="p-12 text-center">
              <div className="bg-gray-100 rounded-full p-6 w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                <UsersIcon className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No Groups Found</h3>
              <p className="text-gray-500">Create your first group to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-white/40">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                      Group Name
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-bold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200/50">
                  {groups.map((group) => (
                    <tr key={group.id} className="hover:bg-white/90 transition-colors duration-200">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="bg-gradient-to-r from-gray-600 to-gray-700 p-2 rounded-lg mr-3">
                            <UsersIcon className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-gray-900">{group.name}</div>
                            <div className="text-xs text-gray-500">ID: {group.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          {group.description ? (
                            <div>
                              <div className="text-sm text-gray-900">{group.description}</div>
                              <div className="text-xs text-gray-500 flex items-center mt-1">
                                <InformationCircleIcon className="w-3 h-3 mr-1" />
                                Description available
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400 italic">No description</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(group.createdAt).toLocaleDateString('id-ID', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            className="inline-flex items-center px-3 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-sm font-medium rounded-lg hover:from-yellow-600 hover:to-orange-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 transition-all duration-300 transform hover:scale-105 shadow-md"
                            onClick={() => handleEdit(group)}
                          >
                            <PencilIcon className="w-4 h-4 mr-1" />
                            Edit
                          </button>
                          <button
                            className="inline-flex items-center px-3 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white text-sm font-medium rounded-lg hover:from-red-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-300 transform hover:scale-105 shadow-md"
                            onClick={() => handleDelete(group.id)}
                          >
                            <TrashIcon className="w-4 h-4 mr-1" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
