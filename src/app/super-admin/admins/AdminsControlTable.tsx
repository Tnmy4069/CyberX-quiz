'use client';

import React, { useState } from 'react';
import { createAdmin, updateAdmin, toggleAdminStatus, deleteAdmin } from '@/app/actions';
import { Plus, Edit2, Trash2, Loader2, ShieldCheck, Mail, Lock, User } from 'lucide-react';

interface AdminItem {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'disabled';
  createdAt: string;
}

export default function AdminsControlTable({ initialAdmins }: { initialAdmins: AdminItem[] }) {
  const [admins, setAdmins] = useState<AdminItem[]>(initialAdmins);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // Modals States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<AdminItem | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'active' | 'disabled'>('active');

  // Request Loaders
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleToggleStatus = async (id: string) => {
    setLoadingId(id);
    try {
      const res = await toggleAdminStatus(id);
      setAdmins((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: res.status as any } : a))
      );
    } catch (err: any) {
      alert(err.message || 'Failed to toggle status.');
    } finally {
      setLoadingId(null);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete admin "${name}"?`)) {
      return;
    }

    try {
      await deleteAdmin(id);
      setAdmins((prev) => prev.filter((a) => a.id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete admin.');
    }
  };

  const openCreateModal = () => {
    setName('');
    setEmail('');
    setPassword('');
    setErrorMsg(null);
    setShowCreateModal(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) return;

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await createAdmin({ name, email, passwordHash: password });
      setAdmins((prev) => [
        {
          id: res.adminId,
          name,
          email: email.toLowerCase(),
          status: 'active',
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
      setShowCreateModal(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create admin.');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (admin: AdminItem) => {
    setSelectedAdmin(admin);
    setName(admin.name);
    setEmail(admin.email);
    setPassword(''); // blank means no password change
    setStatus(admin.status);
    setErrorMsg(null);
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdmin) return;

    setSubmitting(true);
    setErrorMsg(null);

    try {
      await updateAdmin(selectedAdmin.id, {
        name,
        email,
        status,
        password: password !== '' ? password : undefined,
      });

      setAdmins((prev) =>
        prev.map((a) =>
          a.id === selectedAdmin.id
            ? { ...a, name, email: email.toLowerCase(), status }
            : a
        )
      );
      setShowEditModal(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update admin.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 text-foreground">
      {/* Action Bar */}
      <div className="flex justify-end bg-card border border-border p-4 rounded-xl shadow-sm">
        <button
          onClick={openCreateModal}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl text-sm cursor-pointer shadow transition-all"
        >
          <Plus className="h-4.5 w-4.5" />
          Register Admin
        </button>
      </div>

      {/* Admins Table */}
      <div className="bg-card text-card-foreground border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-secondary/40 border-b border-border text-xs font-semibold text-muted-foreground uppercase">
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Registered Date</th>
                <th className="px-6 py-4">Account Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm">
              {admins.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                    No admins created yet.
                  </td>
                </tr>
              ) : (
                admins.map((a) => (
                  <tr key={a.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-6 py-4 font-semibold text-foreground">
                      {a.name}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-muted-foreground">
                      {a.email}
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-foreground font-mono">
                      {new Date(a.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleStatus(a.id)}
                        disabled={loadingId === a.id}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer border ${
                          a.status === 'active'
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
                            : 'bg-destructive/10 border-destructive/20 text-destructive hover:bg-destructive/20'
                        }`}
                      >
                        {loadingId === a.id ? 'Updating...' : a.status === 'active' ? 'Active' : 'Disabled'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEditModal(a)}
                          className="p-2 border border-border rounded-lg bg-secondary hover:bg-accent text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                          title="Edit admin"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(a.id, a.name)}
                          className="p-2 border border-border rounded-lg bg-secondary hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-all cursor-pointer"
                          title="Delete admin"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="max-w-md w-full bg-card border border-border rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-start border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-bold text-foreground">Register Admin User</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-muted-foreground hover:text-foreground font-bold cursor-pointer text-xl"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-foreground">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                    <User className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Sarah Connor"
                    className="w-full pl-10 pr-4 py-2.5 bg-secondary text-foreground border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1.5 text-foreground">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="sarah@platform.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-secondary text-foreground border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1.5 text-foreground">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 bg-secondary text-foreground border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    required
                  />
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-xl">
                  {errorMsg}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-border rounded-xl text-xs font-semibold hover:bg-secondary cursor-pointer text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-1 px-5 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl text-xs cursor-pointer shadow disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Register'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {showEditModal && selectedAdmin && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="max-w-md w-full bg-card border border-border rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-start border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-bold text-foreground">Edit Admin Details</h3>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-muted-foreground hover:text-foreground font-bold cursor-pointer text-xl"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-foreground">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-secondary text-foreground border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1.5 text-foreground">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-secondary text-foreground border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1.5 text-foreground">New Password (optional)</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Leave blank to keep current"
                  className="w-full px-4 py-2.5 bg-secondary text-foreground border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1.5 text-foreground">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-4 py-2.5 bg-secondary text-foreground border border-border rounded-xl focus:outline-none text-sm"
                >
                  <option value="active">Active</option>
                  <option value="disabled">Disabled</option>
                </select>
              </div>

              {errorMsg && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-xl">
                  {errorMsg}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-border rounded-xl text-xs font-semibold hover:bg-secondary cursor-pointer text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-1 px-5 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl text-xs cursor-pointer shadow disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
