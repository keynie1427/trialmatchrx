'use client';

// src/app/trial-matcher/admin/page.tsx
//
// Admin UI for managing the trial_matcher_users whitelist.
// Only accessible to users with role: 'admin' in Firestore.
//
// Auth flow:
//   Not logged in          → redirect to /login
//   Logged in, not admin   → redirect to /trial-matcher (or /access-denied)
//   Logged in, admin       → show user management dashboard

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  UserPlus,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
  Loader2,
  ShieldCheck,
  FlaskConical,
  ArrowLeft,
  Search,
  ToggleLeft,
  ToggleRight,
  AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/Header';
import { useAuth } from '@/hooks/useAuth';
import { auth } from '@/lib/firebase';

// ─── Types ────────────────────────────────────────────────────────────────────

type UserRole = 'crc' | 'physician' | 'admin';

interface WhitelistUser {
  email: string;
  role: UserRole;
  name: string | null;
  organization: string | null;
  active: boolean;
  addedAt: string | null;
  lastLogin: string | null;
}

// ─── Role Badge ───────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: UserRole }) {
  const cfg = {
    admin:     { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-800 dark:text-purple-300', label: 'Admin' },
    crc:       { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-800 dark:text-emerald-300', label: 'CRC' },
    physician: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-800 dark:text-blue-300', label: 'Physician' },
  }[role] || { bg: 'bg-surface-100', text: 'text-surface-600', label: role };

  return (
    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.text}`}>
      {cfg.label}
    </span>
  );
}

// ─── Add / Edit Modal ─────────────────────────────────────────────────────────

function UserModal({
  user, onClose, onSave, loading,
}: {
  user: WhitelistUser | null;
  onClose: () => void;
  onSave: (data: Partial<WhitelistUser> & { email: string }) => Promise<void>;
  loading: boolean;
}) {
  const isEdit = Boolean(user);
  const [email, setEmail]       = useState(user?.email || '');
  const [role, setRole]         = useState<UserRole>(user?.role || 'crc');
  const [name, setName]         = useState(user?.name || '');
  const [org, setOrg]           = useState(user?.organization || '');
  const [error, setError]       = useState('');

  async function handleSubmit() {
    setError('');
    if (!email.trim()) return setError('Email is required');
    if (!email.includes('@')) return setError('Enter a valid email address');
    await onSave({ email: email.trim().toLowerCase(), role, name: name.trim(), organization: org.trim() });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        className="bg-white dark:bg-surface-900 rounded-2xl shadow-2xl w-full max-w-md p-6"
      >
        <h2 className="font-display text-lg font-bold text-surface-900 dark:text-surface-100 mb-5">
          {isEdit ? 'Edit user' : 'Add user to whitelist'}
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-surface-600 dark:text-surface-400 mb-1.5">
              Email address *
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              disabled={isEdit}
              placeholder="coordinator@hospital.org"
              className="w-full px-3 py-2 text-sm rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 outline-none focus:border-primary-400 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-surface-600 dark:text-surface-400 mb-1.5">
              Role *
            </label>
            <select
              value={role}
              onChange={e => setRole(e.target.value as UserRole)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 outline-none focus:border-primary-400 cursor-pointer"
            >
              <option value="crc">CRC — Clinical Research Coordinator</option>
              <option value="physician">Physician</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-surface-600 dark:text-surface-400 mb-1.5">
              Full name
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Dr. Jane Smith"
              className="w-full px-3 py-2 text-sm rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 outline-none focus:border-primary-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-surface-600 dark:text-surface-400 mb-1.5">
              Organization
            </label>
            <input
              type="text"
              value={org}
              onChange={e => setOrg(e.target.value)}
              placeholder="LCRI Oncology Center"
              className="w-full px-3 py-2 text-sm rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 outline-none focus:border-primary-400"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" /> {error}
            </p>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 text-sm font-semibold text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {isEdit ? 'Save changes' : 'Add user'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────

function DeleteModal({
  user, onClose, onConfirm, loading,
}: {
  user: WhitelistUser;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        className="bg-white dark:bg-surface-900 rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center"
      >
        <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-4">
          <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
        </div>
        <h2 className="font-display text-lg font-bold text-surface-900 dark:text-surface-100 mb-2">
          Remove user?
        </h2>
        <p className="text-sm text-surface-500 dark:text-surface-400 mb-6">
          <span className="font-semibold text-surface-700 dark:text-surface-300">{user.email}</span> will
          immediately lose access to the Trial Matcher. This cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 text-sm font-semibold text-surface-600 hover:bg-surface-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Remove
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TrialMatcherAdminPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [accessChecking, setAccessChecking] = useState(true);
  const [isAdmin, setIsAdmin]               = useState(false);

  const [users, setUsers]           = useState<WhitelistUser[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [search, setSearch]         = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');

  const [addModal, setAddModal]     = useState(false);
  const [editUser, setEditUser]     = useState<WhitelistUser | null>(null);
  const [deleteUser, setDeleteUser] = useState<WhitelistUser | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast]           = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // ── Get Firebase ID token for API calls ───────────────────────────────────

  async function getToken(): Promise<string> {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('Not authenticated');
    return currentUser.getIdToken();
  }

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  // ── Auth check ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (authLoading) return;
    if (!user?.email) { router.replace('/login?next=/trial-matcher/admin'); return; }

    // Check admin role via API (reuses same whitelist check)
    getToken().then(token =>
      fetch('/api/trial-matcher/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
      })
    ).then(res => {
      setAccessChecking(false);
      if (res.ok) {
        setIsAdmin(true);
      } else {
        // Not admin — send to trial matcher
        router.replace('/trial-matcher');
      }
    }).catch(() => {
      setAccessChecking(false);
      router.replace('/trial-matcher');
    });
  }, [user, authLoading, router]);

  // ── Fetch users ────────────────────────────────────────────────────────────

  const fetchUsers = useCallback(async () => {
    setDataLoading(true);
    try {
      const token = await getToken();
      const res = await fetch('/api/trial-matcher/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setUsers(data.users || []);
    } catch {
      showToast('Failed to load users', 'error');
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) fetchUsers();
  }, [isAdmin, fetchUsers]);

  // ── Add user ───────────────────────────────────────────────────────────────

  async function handleAdd(data: Partial<WhitelistUser> & { email: string }) {
    setActionLoading(true);
    try {
      const token = await getToken();
      const res = await fetch('/api/trial-matcher/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to add user');
      setAddModal(false);
      showToast(`${data.email} added successfully`);
      fetchUsers();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to add user', 'error');
    } finally {
      setActionLoading(false);
    }
  }

  // ── Edit user ──────────────────────────────────────────────────────────────

  async function handleEdit(data: Partial<WhitelistUser> & { email: string }) {
    setActionLoading(true);
    try {
      const token = await getToken();
      const res = await fetch(`/api/trial-matcher/admin/users/${encodeURIComponent(data.email)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to update user');
      setEditUser(null);
      showToast(`${data.email} updated`);
      fetchUsers();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update user', 'error');
    } finally {
      setActionLoading(false);
    }
  }

  // ── Toggle active ──────────────────────────────────────────────────────────

  async function handleToggleActive(u: WhitelistUser) {
    try {
      const token = await getToken();
      const res = await fetch(`/api/trial-matcher/admin/users/${encodeURIComponent(u.email)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ active: !u.active }),
      });
      if (!res.ok) throw new Error();
      showToast(`${u.email} ${!u.active ? 'activated' : 'deactivated'}`);
      fetchUsers();
    } catch {
      showToast('Failed to update user', 'error');
    }
  }

  // ── Delete user ────────────────────────────────────────────────────────────

  async function handleDelete() {
    if (!deleteUser) return;
    setActionLoading(true);
    try {
      const token = await getToken();
      const res = await fetch(`/api/trial-matcher/admin/users/${encodeURIComponent(deleteUser.email)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to delete user');
      setDeleteUser(null);
      showToast(`${deleteUser.email} removed`);
      fetchUsers();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to delete user', 'error');
    } finally {
      setActionLoading(false);
    }
  }

  // ── Filtered users ─────────────────────────────────────────────────────────

  const filtered = users.filter(u => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return u.email.includes(q) || (u.name || '').toLowerCase().includes(q) || (u.organization || '').toLowerCase().includes(q);
    }
    return true;
  });

  const stats = {
    total:     users.length,
    active:    users.filter(u => u.active).length,
    admins:    users.filter(u => u.role === 'admin').length,
    crcs:      users.filter(u => u.role === 'crc').length,
    physicians: users.filter(u => u.role === 'physician').length,
  };

  // ── Loading / auth states ──────────────────────────────────────────────────

  if (authLoading || accessChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (!isAdmin) return null;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-surface-50 dark:bg-surface-950">

        {/* Page header */}
        <div className="bg-white dark:bg-surface-900 border-b border-surface-200 dark:border-surface-700 px-6 py-4">
          <div className="max-w-5xl mx-auto flex items-center gap-4 flex-wrap">
            <Link
              href="/trial-matcher"
              className="flex items-center gap-1.5 text-sm text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Trial Matcher
            </Link>
            <div className="h-4 w-px bg-surface-200 dark:bg-surface-700" />
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-purple-600" />
              <h1 className="font-display text-lg font-bold text-surface-900 dark:text-surface-100">
                User Management
              </h1>
            </div>
            <span className="text-sm text-surface-400">trial_matcher_users whitelist</span>
            <button
              onClick={() => setAddModal(true)}
              className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Add user
            </button>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 py-6">

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
            {[
              { label: 'Total users',  value: stats.total,      color: 'text-surface-900 dark:text-surface-100' },
              { label: 'Active',       value: stats.active,     color: 'text-emerald-700 dark:text-emerald-400' },
              { label: 'Admins',       value: stats.admins,     color: 'text-purple-700 dark:text-purple-400' },
              { label: 'CRCs',         value: stats.crcs,       color: 'text-emerald-700 dark:text-emerald-400' },
              { label: 'Physicians',   value: stats.physicians, color: 'text-blue-700 dark:text-blue-400' },
            ].map(s => (
              <div key={s.label} className="bg-white dark:bg-surface-900 rounded-xl p-3 border border-surface-200 dark:border-surface-700">
                <p className="text-[10px] font-bold text-surface-400 uppercase tracking-wider mb-1">{s.label}</p>
                <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Controls */}
          <div className="flex gap-3 mb-4 flex-wrap items-center">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-surface-400" />
              <input
                className="pl-8 pr-3 py-2 text-sm rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100 outline-none focus:border-primary-400 w-52"
                placeholder="Search email or name…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <select
              className="text-sm px-3 py-2 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100 outline-none cursor-pointer"
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value as UserRole | 'all')}
            >
              <option value="all">All roles</option>
              <option value="admin">Admin</option>
              <option value="crc">CRC</option>
              <option value="physician">Physician</option>
            </select>
            <span className="text-sm text-surface-400">{filtered.length} users</span>
            <button onClick={fetchUsers} className="ml-auto text-xs text-primary-600 dark:text-primary-400 hover:underline">
              ↻ Refresh
            </button>
          </div>

          {/* User table */}
          <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-700 overflow-hidden">
            {dataLoading ? (
              <div className="flex items-center justify-center py-16 text-surface-400">
                <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading users…
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 text-surface-400">
                <Users className="w-8 h-8 mx-auto mb-3 opacity-30" />
                <p className="text-sm">{search ? 'No users match your search' : 'No users yet — add one above'}</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-100 dark:border-surface-800">
                    <th className="text-left p-4 text-xs font-bold text-surface-400 uppercase tracking-wider">User</th>
                    <th className="text-left p-4 text-xs font-bold text-surface-400 uppercase tracking-wider">Role</th>
                    <th className="text-left p-4 text-xs font-bold text-surface-400 uppercase tracking-wider hidden sm:table-cell">Organization</th>
                    <th className="text-left p-4 text-xs font-bold text-surface-400 uppercase tracking-wider hidden md:table-cell">Added</th>
                    <th className="text-left p-4 text-xs font-bold text-surface-400 uppercase tracking-wider hidden md:table-cell">Last login</th>
                    <th className="text-left p-4 text-xs font-bold text-surface-400 uppercase tracking-wider">Status</th>
                    <th className="p-4" />
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence initial={false}>
                    {filtered.map(u => (
                      <motion.tr
                        key={u.email}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={`border-b border-surface-50 dark:border-surface-800 transition-colors ${!u.active ? 'opacity-50' : ''}`}
                      >
                        <td className="p-4">
                          <p className="font-semibold text-surface-900 dark:text-surface-100">{u.name || '—'}</p>
                          <p className="text-xs text-surface-400 mt-0.5">{u.email}</p>
                        </td>
                        <td className="p-4"><RoleBadge role={u.role} /></td>
                        <td className="p-4 text-surface-500 dark:text-surface-400 hidden sm:table-cell">
                          {u.organization || '—'}
                        </td>
                        <td className="p-4 text-surface-400 text-xs hidden md:table-cell">
                          {u.addedAt ? new Date(u.addedAt).toLocaleDateString() : '—'}
                        </td>
                        <td className="p-4 text-surface-400 text-xs hidden md:table-cell">
                          {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never'}
                        </td>
                        <td className="p-4">
                          <button
                            onClick={() => handleToggleActive(u)}
                            title={u.active ? 'Deactivate' : 'Activate'}
                            className="flex items-center gap-1.5 text-xs font-semibold transition-colors"
                          >
                            {u.active
                              ? <><ToggleRight className="w-5 h-5 text-emerald-500" /><span className="text-emerald-600 dark:text-emerald-400">Active</span></>
                              : <><ToggleLeft className="w-5 h-5 text-surface-300" /><span className="text-surface-400">Inactive</span></>
                            }
                          </button>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2 justify-end">
                            <button
                              onClick={() => setEditUser(u)}
                              className="p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 transition-colors"
                              title="Edit"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            {u.email !== user?.email && (
                              <button
                                onClick={() => setDeleteUser(u)}
                                className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-surface-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                title="Remove"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>

      {/* Modals */}
      <AnimatePresence>
        {addModal && (
          <UserModal user={null} onClose={() => setAddModal(false)} onSave={handleAdd} loading={actionLoading} />
        )}
        {editUser && (
          <UserModal user={editUser} onClose={() => setEditUser(null)} onSave={handleEdit} loading={actionLoading} />
        )}
        {deleteUser && (
          <DeleteModal user={deleteUser} onClose={() => setDeleteUser(null)} onConfirm={handleDelete} loading={actionLoading} />
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold z-50 ${
              toast.type === 'success'
                ? 'bg-emerald-600 text-white'
                : 'bg-red-600 text-white'
            }`}
          >
            {toast.type === 'success'
              ? <CheckCircle2 className="w-4 h-4" />
              : <XCircle className="w-4 h-4" />
            }
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
