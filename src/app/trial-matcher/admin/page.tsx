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
  CheckCircle2 as CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  ShieldCheck,
  FlaskConical,
  Globe,
  Plus,
  RefreshCw,
  Sparkles,
  ArrowLeft,
  Search,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/Header';
import { useAuth } from '@/hooks/useAuth';
import { auth } from '@/lib/firebase';

// ─── Types ────────────────────────────────────────────────────────────────────

type UserRole = 'crc' | 'physician' | 'admin' | 'sponsor';

interface WhitelistUser {
  email: string;
  role: UserRole;
  name: string | null;
  organization: string | null;
  active: boolean;
  addedAt: string | null;
  lastLogin: string | null;
  assignedTrialId?: string | null;
}

// ─── Role Badge ───────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: UserRole }) {
  const cfg = {
    admin:     { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-800 dark:text-purple-300', label: 'Admin' },
    crc:       { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-800 dark:text-emerald-300', label: 'CRC' },
    physician: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-800 dark:text-blue-300', label: 'Physician' },
    sponsor:   { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-800 dark:text-orange-300', label: 'Sponsor' },
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
  const [trialId, setTrialId]   = useState(user?.assignedTrialId || '');
  const [error, setError]       = useState('');

  async function handleSubmit() {
    setError('');
    if (!email.trim()) return setError('Email is required');
    if (!email.includes('@')) return setError('Enter a valid email address');
    await onSave({ email: email.trim().toLowerCase(), role, name: name.trim(), organization: org.trim(), assignedTrialId: role === 'sponsor' ? trialId.trim() : undefined });
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
              <option value="sponsor">Sponsor — Read-only portal access</option>
            </select>
          </div>

          {role === 'sponsor' && (
            <div>
              <label className="block text-xs font-semibold text-surface-600 dark:text-surface-400 mb-1.5">
                Assigned trial NCT ID *
              </label>
              <select
                value={trialId}
                onChange={e => setTrialId(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 outline-none focus:border-primary-400 cursor-pointer"
              >
                <option value="">Select a trial…</option>
                <option value="NCT06983743">NCT06983743 — ERAS-0015 (AURORAS-1)</option>
                <option value="NCT04093167">NCT04093167 — MARIPOSA-2</option>
                <option value="NCT04657003">NCT04657003 — BREAKWATER</option>
                <option value="NCT02628067">NCT02628067 — KEYNOTE-158</option>
                <option value="NCT02422615">NCT02422615 — MONARCH-3</option>
                <option value="NCT04494425">NCT04494425 — DESTINY-Breast06</option>
                <option value="NCT02263508">NCT02263508 — MASTERKEY-265</option>
                <option value="NCT03318939">NCT03318939 — ZENITH20</option>
                <option value="NCT03539536">NCT03539536 — PRODIGE-48</option>
              </select>
              <p className="text-xs text-surface-400 mt-1">Sponsor will only see patients eligible for this trial.</p>
            </div>
          )}

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

  // Tab state
  const [activeTab, setActiveTab] = useState<'users' | 'trials'>('users');

  // Users state
  const [users, setUsers]           = useState<WhitelistUser[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [search, setSearch]         = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');

  // Trials state
  const [firestoreTrials, setFirestoreTrials]   = useState<any[]>([]);
  const [trialsLoading, setTrialsLoading]       = useState(false);
  const [ctSearch, setCtSearch]                 = useState('');
  const [ctResults, setCtResults]               = useState<any[]>([]);
  const [ctSearching, setCtSearching]           = useState(false);
  const [selectedCtTrial, setSelectedCtTrial]   = useState<any | null>(null);
  const [parsedRules, setParsedRules]           = useState<any[] | null>(null);
  const [parsing, setParsing]                   = useState(false);
  const [addingTrial, setAddingTrial]           = useState(false);
  const [discoveringTrials, setDiscoveringTrials] = useState(false);

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
    total:      users.length,
    active:     users.filter(u => u.active).length,
    admins:     users.filter(u => u.role === 'admin').length,
    crcs:       users.filter(u => u.role === 'crc').length,
    physicians: users.filter(u => u.role === 'physician').length,
    sponsors:   users.filter(u => u.role === 'sponsor').length,
  };

  // ── Fetch Firestore trials ─────────────────────────────────────────────────
  const fetchFirestoreTrials = useCallback(async () => {
    setTrialsLoading(true);
    try {
      const token = await getToken();
      const res = await fetch('/api/trial-matcher/trials', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setFirestoreTrials(data.trials || []);
    } catch { showToast('Failed to load trials', 'error'); }
    finally { setTrialsLoading(false); }
  }, []);

  useEffect(() => { if (isAdmin && activeTab === 'trials') fetchFirestoreTrials(); }, [isAdmin, activeTab, fetchFirestoreTrials]);

  // ── Search ClinicalTrials.gov ──────────────────────────────────────────────
  async function handleCtSearch() {
    if (!ctSearch.trim()) return;
    setCtSearching(true); setCtResults([]); setSelectedCtTrial(null); setParsedRules(null);
    try {
      const token = await getToken();
      // Try as NCT ID first
      const isNct = /^NCT\d+$/i.test(ctSearch.trim());
      const url = isNct
        ? `/api/trial-matcher/trials?nctId=${ctSearch.trim().toUpperCase()}`
        : `/api/trial-matcher/trials?query=${encodeURIComponent(ctSearch.trim())}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (isNct && data.trial) {
        setCtResults([data.trial]);
      } else {
        setCtResults(data.trials || []);
      }
    } catch { showToast('Search failed', 'error'); }
    finally { setCtSearching(false); }
  }

  // ── Parse criteria with AI ─────────────────────────────────────────────────
  async function handleParseCriteria(trial: any) {
    setSelectedCtTrial(trial); setParsedRules(null); setParsing(true);
    try {
      const token = await getToken();
      const res = await fetch('/api/trial-matcher/trials/parse-criteria', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ nctId: trial.nctId, rawEligibility: trial.rawEligibility, indication: trial.indication }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      // Store full response including validation — UI reads data.matchingRules, data.summary, data.validation
      setParsedRules({ ...data, rules: data.matchingRules } as any);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'AI parsing failed', 'error');
    } finally { setParsing(false); }
  }

  // ── Add trial to Firestore ─────────────────────────────────────────────────
  async function handleAddTrial(trial: any, rules: any[]) {
    setAddingTrial(true);
    try {
      const token = await getToken();
      const res = await fetch('/api/trial-matcher/trials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ nctId: trial.nctId, matchingRules: rules }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast(`${trial.nctId} added — pending review`);
      setSelectedCtTrial(null); setParsedRules(null); setCtResults([]);
      fetchFirestoreTrials();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to add trial', 'error');
    } finally { setAddingTrial(false); }
  }

  // ── Activate / deactivate trial ────────────────────────────────────────────
  async function handleToggleTrialStatus(trial: any) {
    const newStatus = trial.trialStatus === 'active' ? 'inactive' : 'active';
    try {
      const token = await getToken();
      const res = await fetch(`/api/trial-matcher/trials/${trial.nctId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ trialStatus: newStatus }),
      });
      if (!res.ok) throw new Error();
      showToast(`${trial.nctId} ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
      fetchFirestoreTrials();
    } catch { showToast('Failed to update trial', 'error'); }
  }

  // ── Delete trial ──────────────────────────────────────────────────────────
  async function handleDeleteTrial(nctId: string) {
    if (!confirm(`Remove ${nctId} from the matcher?`)) return;
    try {
      const token = await getToken();
      const res = await fetch(`/api/trial-matcher/trials/${nctId}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      showToast(`${nctId} removed`);
      fetchFirestoreTrials();
    } catch { showToast('Failed to remove trial', 'error'); }
  }

  // ── Run auto-discovery ────────────────────────────────────────────────────
  async function handleDiscover() {
    setDiscoveringTrials(true);
    try {
      const token = await getToken();
      const res = await fetch('/api/trial-matcher/trials/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ dryRun: false }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast(`Auto-discovery complete — ${data.discovered} new trials found`);
      fetchFirestoreTrials();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Discovery failed', 'error');
    } finally { setDiscoveringTrials(false); }
  }

  // ── Trial status badge ────────────────────────────────────────────────────
  function TrialStatusBadge({ status }: { status: string }) {
    const cfg = {
      active:         { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-800 dark:text-emerald-300', label: 'Active' },
      pending_review: { bg: 'bg-amber-100 dark:bg-amber-900/30',   text: 'text-amber-800 dark:text-amber-300',   label: 'Pending review' },
      inactive:       { bg: 'bg-surface-100 dark:bg-surface-800',   text: 'text-surface-500',                     label: 'Inactive' },
    }[status] || { bg: 'bg-surface-100', text: 'text-surface-500', label: status };
    return <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>;
  }

  // ── Render ─────────────────────────────────────────────────────────────────

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
                Admin
              </h1>
            </div>
            {/* Tab switcher */}
            <div className="flex items-center gap-1 ml-2 bg-surface-100 dark:bg-surface-800 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('users')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-semibold transition-colors ${activeTab === 'users' ? 'bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 shadow-sm' : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'}`}
              >
                <Users className="w-3.5 h-3.5" /> Users
              </button>
              <button
                onClick={() => setActiveTab('trials')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-semibold transition-colors ${activeTab === 'trials' ? 'bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 shadow-sm' : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'}`}
              >
                <FlaskConical className="w-3.5 h-3.5" /> Trials
              </button>
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

          {activeTab === 'users' && (<>
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 mb-6">
            {[
              { label: 'Total users',  value: stats.total,      color: 'text-surface-900 dark:text-surface-100' },
              { label: 'Active',       value: stats.active,     color: 'text-emerald-700 dark:text-emerald-400' },
              { label: 'Admins',       value: stats.admins,     color: 'text-purple-700 dark:text-purple-400' },
              { label: 'CRCs',         value: stats.crcs,       color: 'text-emerald-700 dark:text-emerald-400' },
              { label: 'Physicians',   value: stats.physicians, color: 'text-blue-700 dark:text-blue-400' },
              { label: 'Sponsors',     value: stats.sponsors,   color: 'text-orange-700 dark:text-orange-400' },
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
              <option value="sponsor">Sponsor</option>
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
                    <th className="text-left p-4 text-xs font-bold text-surface-400 uppercase tracking-wider hidden md:table-cell">Assigned trial</th>
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
                        <td className="p-4 hidden md:table-cell">
                          {u.assignedTrialId
                            ? <span className="text-xs font-semibold px-2 py-1 rounded-full bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300">{u.assignedTrialId}</span>
                            : <span className="text-xs text-surface-400">—</span>
                          }
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
          </>)}

          {activeTab === 'trials' && (<>
            {/* Trials tab header */}
            <div className="flex items-center gap-3 mb-5 flex-wrap">
              <div>
                <h2 className="text-base font-bold text-surface-900 dark:text-surface-100">Trial Management</h2>
                <p className="text-xs text-surface-500 mt-0.5">Search ClinicalTrials.gov, parse criteria with AI, activate trials without code changes</p>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <button
                  onClick={handleDiscover}
                  disabled={discoveringTrials}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  {discoveringTrials ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Globe className="w-3.5 h-3.5" />}
                  {discoveringTrials ? 'Discovering…' : 'Auto-discover trials'}
                </button>
                <button onClick={fetchFirestoreTrials} className="text-xs text-primary-600 dark:text-primary-400 hover:underline">↻ Refresh</button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

              {/* Left: Search + results */}
              <div className="space-y-4">
                {/* Search box */}
                <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-700 p-4">
                  <p className="text-xs font-bold text-surface-500 uppercase tracking-wider mb-3">Search ClinicalTrials.gov</p>
                  <div className="flex gap-2">
                    <input
                      className="flex-1 px-3 py-2 text-sm rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 outline-none focus:border-primary-400"
                      placeholder="NCT ID or keyword (e.g. KRAS colorectal)"
                      value={ctSearch}
                      onChange={e => setCtSearch(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleCtSearch()}
                    />
                    <button
                      onClick={handleCtSearch}
                      disabled={ctSearching || !ctSearch.trim()}
                      className="px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold disabled:opacity-50 flex items-center gap-1.5 transition-colors"
                    >
                      {ctSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Globe className="w-3.5 h-3.5" />}
                      Search
                    </button>
                  </div>
                  {ctResults.length > 0 && (
                    <p className="text-xs text-surface-400 mt-2">{ctResults.length} result{ctResults.length !== 1 ? 's' : ''} from ClinicalTrials.gov</p>
                  )}
                </div>

                {/* CT.gov results */}
                {ctResults.length > 0 && (
                  <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-700 overflow-hidden">
                    {ctResults.map((trial, i) => (
                      <div key={trial.nctId}
                        className={`p-4 border-b border-surface-50 dark:border-surface-800 cursor-pointer hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors ${selectedCtTrial?.nctId === trial.nctId ? 'bg-primary-50 dark:bg-primary-900/10 border-l-2 border-l-primary-500' : ''}`}
                        onClick={() => handleParseCriteria(trial)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-primary-600 dark:text-primary-400">{trial.nctId}</p>
                            <p className="text-sm font-semibold text-surface-900 dark:text-surface-100 mt-0.5 leading-snug">{trial.name}</p>
                            <p className="text-xs text-surface-500 mt-1">{trial.phase} · {trial.sponsor}</p>
                            <p className="text-xs text-surface-400 mt-0.5 truncate">{trial.indication}</p>
                          </div>
                          <div className="flex-shrink-0 flex flex-col items-end gap-1.5">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${trial.status === 'Recruiting' ? 'bg-emerald-100 text-emerald-700' : 'bg-surface-100 text-surface-500'}`}>
                              {trial.status}
                            </span>
                            <button
                              onClick={e => { e.stopPropagation(); handleParseCriteria(trial); }}
                              disabled={parsing && selectedCtTrial?.nctId === trial.nctId}
                              className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 hover:bg-purple-200 transition-colors disabled:opacity-50"
                            >
                              {parsing && selectedCtTrial?.nctId === trial.nctId
                                ? <Loader2 className="w-3 h-3 animate-spin" />
                                : <Sparkles className="w-3 h-3" />
                              }
                              Parse with AI
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Firestore trials */}
                <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-700 overflow-hidden">
                  <div className="px-4 py-3 border-b border-surface-100 dark:border-surface-800 flex items-center justify-between">
                    <p className="text-xs font-bold text-surface-500 uppercase tracking-wider">In matcher ({firestoreTrials.length})</p>
                  </div>
                  {trialsLoading ? (
                    <div className="flex items-center justify-center py-8 text-surface-400"><Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading…</div>
                  ) : firestoreTrials.length === 0 ? (
                    <div className="text-center py-8 text-surface-400">
                      <FlaskConical className="w-7 h-7 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No trials added yet</p>
                    </div>
                  ) : (
                    firestoreTrials.map(trial => (
                      <div key={trial.nctId} className="p-4 border-b border-surface-50 dark:border-surface-800 flex items-center gap-3">
                        <div className="w-2 h-8 rounded-full flex-shrink-0" style={{ background: trial.color || '#6b7280' }} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-xs font-bold text-surface-900 dark:text-surface-100">{trial.nctId}</p>
                            <TrialStatusBadge status={trial.trialStatus} />
                            {trial.source === 'auto_discovery' && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/20 text-blue-600 font-semibold">Auto</span>
                            )}
                          </div>
                          <p className="text-xs text-surface-500 mt-0.5 truncate">{trial.name}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={() => handleToggleTrialStatus(trial)}
                            className={`text-[10px] font-semibold px-2 py-1 rounded-lg transition-colors ${trial.trialStatus === 'active' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-surface-100 text-surface-500 hover:bg-surface-200'}`}
                          >
                            {trial.trialStatus === 'active' ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => handleDeleteTrial(trial.nctId)}
                            className="text-[10px] text-red-500 hover:text-red-700 font-semibold px-2 py-1 rounded-lg hover:bg-red-50 transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Right: AI criteria review panel */}
              <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-700 overflow-hidden flex flex-col">
                <div className="px-4 py-3 border-b border-surface-100 dark:border-surface-800 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  <p className="text-xs font-bold text-surface-500 uppercase tracking-wider">AI Criteria Review</p>
                  {selectedCtTrial && <span className="ml-auto text-xs font-semibold text-primary-600">{selectedCtTrial.nctId}</span>}
                </div>

                {!selectedCtTrial ? (
                  <div className="flex flex-col items-center justify-center flex-1 p-8 text-center text-surface-400">
                    <Sparkles className="w-10 h-10 mb-3 opacity-20" />
                    <p className="text-sm font-medium text-surface-500">Select a trial and click "Parse with AI"</p>
                    <p className="text-xs mt-1">Claude extracts eligibility criteria into plain English rules — no code required</p>
                  </div>
                ) : parsing ? (
                  <div className="flex flex-col items-center justify-center flex-1 p-8 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-500 mb-3" />
                    <p className="text-sm font-semibold text-surface-700 dark:text-surface-300">Claude is parsing eligibility criteria…</p>
                    <p className="text-xs text-surface-400 mt-1">Extracting rules + running live patient validation</p>
                  </div>
                ) : parsedRules ? (
                  <div className="flex flex-col flex-1 overflow-hidden">
                    {/* Validation summary */}
                    {(parsedRules as any).validation && (
                      <div className={`mx-4 mt-4 p-3 rounded-xl border text-xs ${
                        (parsedRules as any).validation.plausibilityFlag === 'ok'   ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800/40' :
                        (parsedRules as any).validation.plausibilityFlag === 'low'  ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800/40' :
                        (parsedRules as any).validation.plausibilityFlag === 'high' ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/40' :
                        'bg-surface-50 dark:bg-surface-800 border-surface-200'
                      }`}>
                        <div className="flex items-center gap-2 mb-1">
                          {(parsedRules as any).validation.plausibilityFlag === 'ok'   && <CheckCircle className="w-4 h-4 text-emerald-600" />}
                          {(parsedRules as any).validation.plausibilityFlag === 'low'  && <XCircle className="w-4 h-4 text-red-600" />}
                          {(parsedRules as any).validation.plausibilityFlag === 'high' && <AlertTriangle className="w-4 h-4 text-amber-600" />}
                          <span className="font-bold text-surface-900 dark:text-surface-100">
                            Live validation: {(parsedRules as any).validation.matchCount} of {(parsedRules as any).validation.totalPatients} patients matched
                          </span>
                        </div>
                        <p className="text-surface-600 dark:text-surface-400 leading-relaxed">
                          {(parsedRules as any).validation.plausibilityMessage}
                        </p>
                      </div>
                    )}

                    {/* Rule summary badges */}
                    {(parsedRules as any).summary && (
                      <div className="flex gap-2 px-4 mt-3 flex-wrap">
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300">
                          ✓ {(parsedRules as any).summary.autoConfirmed} auto-confirmed
                        </span>
                        {(parsedRules as any).summary.needsReview > 0 && (
                          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300">
                            ⚠ {(parsedRules as any).summary.needsReview} need review
                          </span>
                        )}
                        {(parsedRules as any).summary.manualOnly > 0 && (
                          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-surface-100 dark:bg-surface-800 text-surface-600">
                            {(parsedRules as any).summary.manualOnly} manual only
                          </span>
                        )}
                      </div>
                    )}

                    {/* Plain English rules */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-2 mt-2">
                      {((parsedRules as any).rules || parsedRules as any[]).map((rule: any, i: number) => (
                        <div key={i} className={`p-3 rounded-xl border ${
                          rule.operator === 'manual'
                            ? 'bg-surface-50 dark:bg-surface-800/50 border-surface-200 dark:border-surface-700'
                            : rule.autoConfirm
                            ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800/30'
                            : 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/40'
                        }`}>
                          <div className="flex items-start gap-2.5">
                            <div className="flex-shrink-0 mt-0.5">
                              {rule.operator === 'manual'
                                ? <span className="text-surface-400 text-sm">⊘</span>
                                : rule.autoConfirm
                                ? <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                : <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                              }
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <p className="text-xs font-bold text-surface-900 dark:text-surface-100">{rule.criterion}</p>
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                  rule.confidence >= 85 ? 'bg-emerald-100 text-emerald-700' :
                                  rule.confidence >= 60 ? 'bg-amber-100 text-amber-700' :
                                  'bg-surface-100 text-surface-500'
                                }`}>{rule.confidence}% confident</span>
                                {rule.required && rule.operator !== 'manual' && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-700">REQUIRED</span>
                                )}
                              </div>
                              <p className="text-xs text-surface-600 dark:text-surface-400 leading-relaxed">{rule.plainEnglish}</p>
                              {rule.reviewNote && (
                                <p className="text-[10px] text-amber-700 dark:text-amber-400 mt-1.5 italic">{rule.reviewNote}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="p-4 border-t border-surface-100 dark:border-surface-800">
                      <details className="text-xs mb-3">
                        <summary className="cursor-pointer text-surface-500 hover:text-surface-700 font-semibold">View raw eligibility text from ClinicalTrials.gov</summary>
                        <div className="max-h-28 overflow-y-auto bg-surface-50 dark:bg-surface-800 rounded-lg p-3 text-[10px] text-surface-600 dark:text-surface-400 leading-relaxed whitespace-pre-wrap mt-2">
                          {selectedCtTrial.rawEligibility?.slice(0, 1200) || 'No eligibility text available'}
                        </div>
                      </details>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleParseCriteria(selectedCtTrial)}
                          disabled={parsing}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-surface-200 dark:border-surface-700 text-xs font-semibold text-surface-600 hover:bg-surface-50 transition-colors"
                        >
                          <RefreshCw className="w-3 h-3" /> Re-parse
                        </button>
                        <button
                          onClick={() => handleAddTrial(selectedCtTrial, (parsedRules as any).rules || parsedRules)}
                          disabled={addingTrial}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold transition-colors disabled:opacity-50"
                        >
                          {addingTrial ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                          Add to matcher (pending review)
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center flex-1 p-8 text-center text-surface-400">
                    <p className="text-sm">Click "Parse with AI" on a search result</p>
                  </div>
                )}
              </div>
            </div>
          </>)}

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
