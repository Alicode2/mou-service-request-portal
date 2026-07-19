import { useNavigate } from 'react-router-dom';
import { PlusCircle } from 'lucide-react';
import Layout from '../components/Layout';
import RequestTicketList from '../components/RequestTicketList';

export default function StudentDashboard() {
  const navigate = useNavigate();
  return (
    <Layout
      eyebrow="Work Orders"
      title="My Requests"
      headerAction={
        <button className="btn btn-amber" onClick={() => navigate('/submit')}>
          <PlusCircle size={16} />
          New request
        </button>
      }
    >
      <RequestTicketList
        emptyTitle="No requests yet"
        emptyBody="Submit your first maintenance request to get started."
      />
    </Layout>
  );
}
