"use client"

import React, { useState, useEffect, useMemo } from 'react'
import { Layout } from "@/components/Layout/PermissionControlledLayout"
import { ShieldCheckIcon, PlusIcon } from '@heroicons/react/24/outline'
import { useToast } from '@/hooks/use-toast'

// Types
interface RolePermission {
  id: number;
  role: string;
  resource_type: string;
  permission_type: string;
  scope: string;
  description: string;
  created_at?: string;
  updated_at?: string;
}

interface ResourceType {
  id: number;
  name: string;
  description: string;
  created_at?: string;
  updated_at?: string;
}

interface RoleDefinition {
  name: string;
  display_name: string;
  description: string;
  permissions: string[];
}

// Actions shown in matrix (labels aligned with DB permission_type names for consistency)
const ACTIONS: { key: string; label: string; perm: string; }[] = [
  { key: 'read', label: 'READ', perm: 'read' },
  { key: 'create', label: 'CREATE', perm: 'create' },
  { key: 'update', label: 'UPDATE', perm: 'update' },
  { key: 'delete', label: 'DELETE', perm: 'delete' },
  { key: 'export', label: 'EXPORT', perm: 'export' },
]

const SCOPES = [ 'none', 'own', 'group', 'all' ] as const;

type ScopeValue = typeof SCOPES[number];

const RESOURCE_GROUPS: { group: string; items: { name: string; description: string }[] }[] = [
  { group: 'QR Management', items: [
    { name: 'qr_code', description: 'Individual QR Codes' },
    { name: 'qr_category', description: 'QR Code Categories' },
  ]},
  { group: 'URL Management', items: [
    { name: 'short_url', description: 'Short URL entries' },
    { name: 'url_category', description: 'Short URL Categories' },
  ]},
  { group: 'Analytics & Detailed Analytics', items: [
    { name: 'qr_analytics', description: 'Aggregated QR analytics' },
    { name: 'qr_event_scans', description: 'Raw QR scan events' },
    { name: 'url_analytics', description: 'Aggregated URL analytics' },
    { name: 'url_event_clicks', description: 'Raw URL click events' },
  ]},
  { group: 'User Management', items: [
    { name: 'profile', description: 'User Profile access' },
    { name: 'user_setting', description: 'User Personal Settings' },
    { name: 'users', description: 'User Accounts' },
    { name: 'group_users', description: 'User Groups / Teams' },
  ]}
];

const FLAT_RESOURCE_TYPES = RESOURCE_GROUPS.flatMap(g => g.items);

const DISPLAY_LABELS: Record<string,string> = {
  qr_code: 'QR Code',
  qr_category: 'QR Category',
  short_url: 'Short URL',
  url_category: 'URL Category',
  qr_analytics: 'QR Analytics',
  qr_event_scans: 'QR Event Scans',
  url_analytics: 'URL Analytics',
  url_event_clicks: 'URL Event Clicks',
  profile: 'Profile',
  user_setting: 'User Setting',
  users: 'Users',
  group_users: 'Group Users'
};

export default function PermissionsRolesPage() {
  const { toast } = useToast();
  const notifyError = (title: string, description: string) => toast({ title, description, variant: 'destructive' });

  const [roles, setRoles] = useState<Record<string, RoleDefinition>>({});
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
  const [resourceTypes, setResourceTypes] = useState<ResourceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeRole, setActiveRole] = useState<string>('');
  const [autoSeedTried, setAutoSeedTried] = useState(false);

  // Modal state for adding resource types (minimal)
  const [showAddResource, setShowAddResource] = useState(false);

  // Data fetching functions
  const fetchRolePermissions = async () => {
    try {
      const response = await fetch('/api/admin/role-permissions');
      if (response.ok) {
        const data = await response.json();
        setRolePermissions(data.data || []);
      } else {
        notifyError('Load Error','Gagal load role permissions');
      }
    } catch {
      notifyError('Load Error','Gagal load role permissions');
    }
  };

  const fetchResourceTypes = async () => {
    try {
      const response = await fetch('/api/admin/resource-types');
      if (response.ok) {
        const data = await response.json();
        setResourceTypes(data.data || []);
      } else {
        notifyError('Load Error','Gagal load resource types');
      }
    } catch {
      notifyError('Load Error','Gagal load resource types');
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await fetch('/api/admin/roles');
      if (response.ok) {
        const data = await response.json();
        const raw = data.data;
        if (Array.isArray(raw)) {
          const obj: Record<string,RoleDefinition> = {};
          raw.forEach((rr:any)=>{ if(rr?.name) obj[rr.name]=rr; });
          setRoles(obj);
          if(!activeRole){
            if(obj['admin']) setActiveRole('admin');
            else { const first = Object.keys(obj)[0]; if(first) setActiveRole(first); }
          }
        } else {
          setRoles(raw || {});
          if(!activeRole){
            const first = Object.keys(raw||{})[0];
            if(first) setActiveRole(first);
          }
        }
      } else {
        notifyError('Load Error','Gagal load roles');
      }
    } catch {
      notifyError('Load Error','Gagal load roles');
    }
  };

  // Auto seed resource types if completely empty (one-time attempt)
  const maybeAutoSeed = async () => {
    if (autoSeedTried) return; // guard
    if (resourceTypes.length === 0) {
      try {
        setAutoSeedTried(true);
        // Create defaults sequentially
        for (const rt of FLAT_RESOURCE_TYPES) {
          await fetch('/api/admin/resource-types', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(rt) });
        }
        await fetchResourceTypes();
        toast({ title: 'Default Resources Added', description: 'Resource types seeded otomatis', variant: 'default' });
      } catch (e) {
        console.error('Auto seed failed', e);
        notifyError('Seed Error','Gagal auto-seed resource types');
      }
    }
  };

  // Initial data loading
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchRoles(),
        fetchRolePermissions(),
        fetchResourceTypes()
      ]);
      setLoading(false);
    };
    loadData();
  }, []);

  useEffect(() => { if(!loading) { maybeAutoSeed(); } }, [loading, resourceTypes.length]);

  // After fetchRolePermissions and fetchRoles, add effect to auto seed admin
  useEffect(() => {
    if (!loading) {
      const hasAdmin = Object.keys(roles).some(r => r.toLowerCase() === 'admin');
      if (hasAdmin) {
        const adminPerms = rolePermissions.filter(p => p.role.toLowerCase() === 'admin');
        if (adminPerms.length === 0) {
          (async () => { try { await fetch('/api/admin/role-permissions/seed', { method:'POST' }); await fetchRolePermissions(); toast({ title:'Seeded', description:'Admin default permissions ditambahkan'}); } catch(e){ console.error(e); } })();
        }
      }
    }
  }, [loading, roles, rolePermissions]);

  // Build matrix state derived
  const canonicalRole = (r:string) => r?.toLowerCase().trim();
  const matrix: Record<string, Record<string, ScopeValue>> = useMemo(() => {
    const base: Record<string, Record<string, ScopeValue>> = {};
    resourceTypes.forEach(rt => { base[rt.name] = {}; ACTIONS.forEach(a => { base[rt.name][a.key] = 'none'; }); });
    const activeNorm = canonicalRole(activeRole || '');
    rolePermissions.filter(p => canonicalRole(p.role) === activeNorm).forEach(p => {
      const act = ACTIONS.find(a => a.perm === p.permission_type); if (!act) return; const scope = (p.scope || 'own') as ScopeValue; if(!base[p.resource_type]) base[p.resource_type] = {} as any; base[p.resource_type][act.key] = scope; });
    return base;
  }, [rolePermissions, resourceTypes, activeRole]);

  // Track edits locally
  const [draft, setDraft] = useState<Record<string, Record<string, ScopeValue>>>({});
  useEffect(() => { setDraft(matrix); }, [matrix]);

  const handleChangeScope = (resource: string, actionKey: string, value: ScopeValue) => {
    if (activeRole && !['admin','administrator','superadmin'].includes(activeRole.toLowerCase())) {
      if ((actionKey === 'update' || actionKey === 'delete') && (value === 'group' || value === 'all')) {
        toast({ title: 'Dibatasi', description: 'Non-admin tidak boleh set update/delete > own', variant: 'destructive' });
        value = 'own';
      }
    }
    setDraft(prev => ({ ...prev, [resource]: { ...(prev[resource]||{}), [actionKey]: value } }));
  };

  const computeDiffPayload = () => {
    const items: any[] = [];
    const activeNorm = canonicalRole(activeRole || '');
    Object.keys(draft).forEach(resource => {
      ACTIONS.forEach(a => {
        const newScope = draft[resource]?.[a.key] ?? 'none';
        const currentScope = matrix[resource]?.[a.key] ?? 'none';
        if (newScope !== currentScope) {
          items.push({ role: activeNorm, resource_type: resource, permission_type: a.perm, scope: newScope });
        }
      });
    });
    return items;
  };

  const savingRef = React.useRef(false);
  const [saving, setSaving] = useState(false);
  const handleSaveMatrix = async () => {
    if (!activeRole) { notifyError('No Role','Tidak ada role aktif'); return; }
    const items = computeDiffPayload();
    if (!items.length) { toast({ title: 'No Changes', description: 'Tidak ada perubahan', variant: 'default' }); return; }
    if (savingRef.current) return; savingRef.current = true; setSaving(true);
    try {
      const res = await fetch('/api/admin/role-permissions/bulk', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items }) });
      if (!res.ok) throw new Error(await res.text());
      await fetchRolePermissions();
      toast({ title: 'Saved', description: 'Permissions updated', variant: 'default' });
    } catch (e:any) {
      console.error('Save error', e);
      toast({ title: 'Error', description: 'Gagal menyimpan: '+ (e?.message||'unknown'), variant: 'destructive' });
    } finally { savingRef.current = false; setSaving(false); }
  };

  async function handleResetRole(){
    if(!activeRole) return; if(!confirm('Reset permissions role ini ke default?')) return;
    const res = await fetch('/api/admin/role-permissions/reset', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ role: activeRole }) });
    if(res.ok){ await fetchRolePermissions(); toast({ title:'Reset', description:'Role direset ke default'});} else { toast({ title:'Error', description:'Gagal reset', variant:'destructive'});} }
  async function handleSeedAll(){
    const res = await fetch('/api/admin/role-permissions/seed', { method:'POST' });
    if(res.ok){ await fetchRolePermissions(); toast({ title:'Seeded', description:'Default permissions ditambahkan'});} else { toast({ title:'Error', description:'Seed gagal', variant:'destructive'});} }

  if (loading) {
    return (
      <Layout usePermissionAwareSidebar={true}>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <ShieldCheckIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-2xl font-bold">
              Permissions & Roles
            </h1>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading permissions data...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const emptyState = resourceTypes.length === 0;

  // Helper function to get display label
  function labelFor(resource: string){ return DISPLAY_LABELS[resource] || resource; }

  return (
    <Layout usePermissionAwareSidebar={true}>
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
            <ShieldCheckIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Permissions & Roles
          </h1>
        </div>

        {/* Role Selector */}
        <div className="flex flex-wrap items-center gap-4 bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Active Role:</span>
            <select value={activeRole} onChange={e => setActiveRole(e.target.value)} className="border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded px-2 py-1 text-sm text-gray-800 dark:text-gray-100">
              {Object.keys(roles).length === 0 && <option value="">(no roles)</option>}
              {Object.keys(roles).map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <button onClick={() => setShowAddResource(true)} className="px-3 py-1.5 text-xs rounded bg-green-600 hover:bg-green-700 text-white">
            Tambah Resource
          </button>
          <button onClick={handleResetRole} className="px-3 py-1.5 text-xs rounded bg-amber-600 hover:bg-amber-700 text-white">
            Reset Role
          </button>
          <button onClick={handleSeedAll} className="px-3 py-1.5 text-xs rounded bg-slate-600 hover:bg-slate-700 text-white">
            Seed Default
          </button>
          <button onClick={handleSaveMatrix} disabled={saving} className="ml-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm rounded-lg">
            {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </div>

        {emptyState && (
          <div className="border border-dashed border-gray-400 dark:border-gray-600 rounded-lg p-8 text-center bg-gray-50 dark:bg-gray-800/40">
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">Belum ada resource types. Klik "Tambah Resource" atau reload untuk auto-seed.</p>
            <div className="flex flex-wrap justify-center gap-2">
              {FLAT_RESOURCE_TYPES.map(rt => <span key={rt.name} className="px-2 py-1 text-xs rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200">{rt.name}</span>)}
            </div>
          </div>
        )}

        {!emptyState && (
          <div className="overflow-auto bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-200">
                  <th className="p-3 text-left font-semibold sticky left-0 bg-gray-50 dark:bg-gray-700/50 z-10">Resource</th>
                  {ACTIONS.map(a => <th key={a.key} className="p-3 text-center font-semibold">{a.label}</th>)}
                </tr>
              </thead>
              <tbody>
                {RESOURCE_GROUPS.map(group => (
                  <React.Fragment key={group.group}>
                    <tr className="bg-gray-100 dark:bg-gray-700/60">
                      <td colSpan={ACTIONS.length + 1} className="px-3 py-2 text-xs font-semibold tracking-wide text-gray-600 dark:text-gray-300 uppercase">
                        {group.group}
                      </td>
                    </tr>
                    {group.items.map(item => {
                      const rt = resourceTypes.find(r => r.name === item.name);
                      if(!rt) return null; // resource not yet in DB -> skip (auto-seed will add)
                      return (
                        <tr key={rt.id} className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/40">
                          <td className="p-3 font-medium text-gray-900 dark:text-gray-100 sticky left-0 bg-white dark:bg-gray-800 z-10 shadow-[1px_0_0_0_rgba(0,0,0,0.05)] dark:shadow-none">
                            {labelFor(rt.name)}
                          </td>
                          {ACTIONS.map(a => {
                            const value = draft[rt.name]?.[a.key] ?? 'none';
                            return (
                              <td key={a.key} className="p-2 text-center">
                                <select
                                  value={value}
                                  onChange={e => handleChangeScope(rt.name, a.key, e.target.value as ScopeValue)}
                                  className="text-xs px-2 py-1 rounded border bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring"
                                >
                                  <option value="none">none</option>
                                  <option value="own">own</option>
                                  <option value="group">group</option>
                                  <option value="all">all</option>
                                </select>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {showAddResource && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50" onClick={() => setShowAddResource(false)}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
              <h3 className="text-sm font-semibold mb-4 text-gray-800 dark:text-gray-100">Tambah Resource Type</h3>
              <form onSubmit={async e => { e.preventDefault(); const fd = new FormData(e.currentTarget); const name = (fd.get('name') as string).trim(); const description = (fd.get('description') as string).trim(); if(!name){ return; } const res = await fetch('/api/admin/resource-types', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, description }) }); if(res.ok){ toast({ title: 'Resource added', description: name }); await fetchResourceTypes(); setShowAddResource(false); } else { toast({ title: 'Gagal', description: 'Tidak bisa tambah resource', variant: 'destructive' }); } }} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-300">Name</label>
                  <input name="name" required className="mt-1 w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1 text-sm" placeholder="qr_codes" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-300">Description</label>
                  <textarea name="description" rows={3} className="mt-1 w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1 text-sm" placeholder="Describe this resource"/></div>
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setShowAddResource(false)} className="px-3 py-1.5 text-xs rounded border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">Cancel</button>
                  <button type="submit" className="px-3 py-1.5 text-xs rounded bg-indigo-600 hover:bg-indigo-700 text-white">Save</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}