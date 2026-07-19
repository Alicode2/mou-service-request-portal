import { useEffect, useState, useCallback } from 'react';
import { UserPlus, AlertCircle, CheckCircle2, Trash2 } from 'lucide-react';
import Layout from '../components/Layout';
import client from '../api/client';

function CreateUserModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'maintenance_officer', department: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await client.post('/users', form);
      onCreated();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create user.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Add user</h3>
        <p style={{ fontSize: 13, color: 'var(--steel-500)', marginBottom: 16 }}>
          Create a maintenance officer or administrator account.
        </p>
        {error && (
          <div className="alert alert-error">
            <AlertCircle size={14} />
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Full name</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="field">
            <label>Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div className="form-row">
            <div className="field">
              <label>Role</label>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <option value="maintenance_officer">Maintenance Officer</option>
                <option value="admin">Administrator</option>
                <option value="student_staff">Student / Staff</option>
              </select>
            </div>
            <div className="field">
              <label>Department</label>
              <input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
            </div>
          </div>
          <div className="field">
            <label>Temporary password</label>
            <input
              type="text"
              required
              minLength={6}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="At least 6 characters"
            />
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
            <button className="btn btn-primary" disabled={saving}>
              {saving ? 'Creating…' : 'Create user'}
            </button>
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [roleFilter, setRoleFilter] = useState('');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const params = { limit: 100 };
      if (roleFilter) params.role = roleFilter;
      if (search) params.search = search;
      const res = await client.get('/users', { params });
      setUsers(res.data.users);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load users.');
    }
  }, [roleFilter, search]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleActive(u) {
    setError('');
    setSuccess('');
    try {
      await client.put(`/users/${u.id}`, { isActive: !u.isActive });
      setSuccess(`${u.name} ${u.isActive ? 'deactivated' : 'reactivated'}.`);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update user.');
    }
  }

  async function changeRole(u, role) {
    setError('');
    try {
      await client.put(`/users/${u.id}`, { role });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update role.');
    }
  }

  async function handleDelete(u) {
    if (!window.confirm(`Delete ${u.name}? This cannot be undone.`)) return;
    setError('');
    try {
      await client.delete(`/users/${u.id}`);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user.');
    }
  }

  return (
    <Layout
      eyebrow="Administration"
      title="Users"
      headerAction={
        <button className="btn btn-amber" onClick={() => setShowModal(true)}>
          <UserPlus size={16} />
          Add user
        </button>
      }
    >
      <div className="toolbar">
        <input type="search" placeholder="Search name or email…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="">All roles</option>
          <option value="student_staff">Student / Staff</option>
          <option value="maintenance_officer">Maintenance Officer</option>
          <option value="admin">Administrator</option>
        </select>
      </div>

      {error && (
        <div className="alert alert-error">
          <AlertCircle size={14} />
          {error}
        </div>
      )}
      {success && (
        <div className="alert alert-success">
          <CheckCircle2 size={14} />
          {success}
        </div>
      )}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Department</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>
                  <select value={u.role} onChange={(e) => changeRole(u, e.target.value)} style={{ fontSize: 12.5, padding: '4px 6px' }}>
                    <option value="student_staff">Student / Staff</option>
                    <option value="maintenance_officer">Maintenance Officer</option>
                    <option value="admin">Administrator</option>
                  </select>
                </td>
                <td>{u.department || '—'}</td>
                <td>
                  <span className={`badge ${u.isActive ? 'badge-completed' : 'badge-rejected'}`}>
                    <span className="badge-dot" />
                    {u.isActive ? 'active' : 'inactive'}
                  </span>
                </td>
                <td style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-outline btn-sm" onClick={() => toggleActive(u)}>
                    {u.isActive ? 'Deactivate' : 'Reactivate'}
                  </button>
                  <button className="btn btn-danger-outline btn-sm" onClick={() => handleDelete(u)}>
                    <Trash2 size={12} />
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', color: 'var(--steel-500)', padding: 30 }}>
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <CreateUserModal
          onClose={() => setShowModal(false)}
          onCreated={() => {
            setShowModal(false);
            setSuccess('User created successfully.');
            load();
          }}
        />
      )}
    </Layout>
  );
}
