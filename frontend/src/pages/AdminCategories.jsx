import { useEffect, useState, useCallback } from 'react';
import { Plus, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react';
import Layout from '../components/Layout';
import client from '../api/client';

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ name: '', description: '', defaultPriority: 'medium' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const res = await client.get('/categories');
    setCategories(res.data.categories);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      await client.post('/categories', form);
      setForm({ name: '', description: '', defaultPriority: 'medium' });
      setSuccess('Category added.');
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create category.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this category? Existing requests referencing it will keep the reference.')) return;
    try {
      await client.delete(`/categories/${id}`);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete category.');
    }
  }

  return (
    <Layout eyebrow="Administration" title="Request Categories">
      <div className="grid-2">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th>Default priority</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c._id}>
                  <td style={{ fontWeight: 600 }}>{c.name}</td>
                  <td style={{ color: 'var(--steel-500)' }}>{c.description || '—'}</td>
                  <td style={{ textTransform: 'capitalize' }}>{c.defaultPriority}</td>
                  <td>
                    <button className="btn btn-danger-outline btn-sm" onClick={() => handleDelete(c._id)}>
                      <Trash2 size={12} />
                    </button>
                  </td>
                </tr>
              ))}
              {categories.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', color: 'var(--steel-500)', padding: 30 }}>
                    No categories yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="card card-pad">
          <div className="section-title" style={{ marginTop: 0 }}>
            Add category
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
          <form onSubmit={handleCreate}>
            <div className="field">
              <label>Name</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="field">
              <label>Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="field">
              <label>Default priority</label>
              <select
                value={form.defaultPriority}
                onChange={(e) => setForm({ ...form, defaultPriority: e.target.value })}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <button className="btn btn-primary" disabled={saving}>
              <Plus size={14} />
              {saving ? 'Adding…' : 'Add category'}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}
