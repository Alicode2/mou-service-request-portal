import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Paperclip, X, AlertCircle } from 'lucide-react';
import Layout from '../components/Layout';
import client from '../api/client';

export default function SubmitRequest() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ title: '', description: '', category: '', location: '', priority: 'medium' });
  const [files, setFiles] = useState([]);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    client.get('/categories').then((res) => setCategories(res.data.categories));
  }, []);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleFileChange(e) {
    const chosen = Array.from(e.target.files || []);
    setFiles((prev) => [...prev, ...chosen].slice(0, 5));
    e.target.value = '';
  }

  function removeFile(idx) {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    setSubmitting(true);
    try {
      const data = new FormData();
      Object.entries(form).forEach(([k, v]) => data.append(k, v));
      files.forEach((f) => data.append('evidence', f));

      const res = await client.post('/requests', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      navigate(`/requests/${res.data.request._id}`);
    } catch (err) {
      const resData = err.response?.data;
      if (resData?.errors) {
        const map = {};
        resData.errors.forEach((er) => (map[er.field] = er.message));
        setFieldErrors(map);
      }
      setError(resData?.message || 'Failed to submit request.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Layout eyebrow="Work Orders" title="Submit a Service Request">
      <div className="card card-pad" style={{ maxWidth: 640 }}>
        {error && (
          <div className="alert alert-error">
            <AlertCircle size={15} />
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="title">Issue title</label>
            <input
              id="title"
              required
              placeholder="e.g. Leaking pipe under sink"
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
            />
            {fieldErrors.title && <div className="field-error">{fieldErrors.title}</div>}
          </div>

          <div className="form-row">
            <div className="field">
              <label htmlFor="category">Category</label>
              <select id="category" required value={form.category} onChange={(e) => update('category', e.target.value)}>
                <option value="">Select category…</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {fieldErrors.category && <div className="field-error">{fieldErrors.category}</div>}
            </div>
            <div className="field">
              <label htmlFor="priority">Priority</label>
              <select id="priority" value={form.priority} onChange={(e) => update('priority', e.target.value)}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div className="field">
            <label htmlFor="location">Location</label>
            <input
              id="location"
              required
              placeholder="e.g. Block C Hostel, Room 12"
              value={form.location}
              onChange={(e) => update('location', e.target.value)}
            />
            {fieldErrors.location && <div className="field-error">{fieldErrors.location}</div>}
          </div>

          <div className="field">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              required
              placeholder="Describe the issue in detail — when it started, how severe it is, anything the officer should know."
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
            />
            {fieldErrors.description && <div className="field-error">{fieldErrors.description}</div>}
          </div>

          <div className="field">
            <label htmlFor="evidence">Evidence (optional)</label>
            <label className="file-drop" htmlFor="evidence">
              <Paperclip size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
              Click to attach photos or a PDF (up to 5 files, 5MB each)
            </label>
            <input id="evidence" type="file" multiple hidden accept="image/*,.pdf" onChange={handleFileChange} />
            {files.length > 0 && (
              <div className="file-chip-list">
                {files.map((f, i) => (
                  <div className="file-chip" key={i}>
                    {f.name}
                    <button type="button" onClick={() => removeFile(i)}>
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Submitting…' : 'Submit request'}
            </button>
            <button type="button" className="btn btn-outline" onClick={() => navigate('/dashboard')}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
