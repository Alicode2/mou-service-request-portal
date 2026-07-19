import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Download } from 'lucide-react';
import Layout from '../components/Layout';
import client from '../api/client';

export default function AdminReports() {
  const [summary, setSummary] = useState(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    client.get('/reports/summary').then((res) => setSummary(res.data));
  }, []);

  async function handleExport() {
    setDownloading(true);
    try {
      const res = await client.get('/reports/export/csv', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'service_requests_report.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  }

  const statusData = (summary?.byStatus || []).map((s) => ({ name: s._id.replace('_', ' '), count: s.count }));
  const categoryData = (summary?.byCategory || []).map((c) => ({ name: c._id, count: c.count }));

  return (
    <Layout
      eyebrow="Administration"
      title="Reports"
      headerAction={
        <button className="btn btn-amber" onClick={handleExport} disabled={downloading}>
          <Download size={15} />
          {downloading ? 'Exporting…' : 'Export CSV'}
        </button>
      }
    >
      {!summary ? (
        <div className="empty-state">Loading…</div>
      ) : (
        <div className="grid-2">
          <div className="card card-pad">
            <div className="section-title" style={{ marginTop: 0 }}>
              Requests by status
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#f0983c" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="card card-pad">
            <div className="section-title" style={{ marginTop: 0 }}>
              Requests by category
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 10.5 }} interval={0} angle={-15} textAnchor="end" height={50} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#10192b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </Layout>
  );
}
