import Layout from '../components/Layout';
import RequestTicketList from '../components/RequestTicketList';

export default function OfficerDashboard() {
  return (
    <Layout eyebrow="Work Orders" title="Assigned to Me">
      <RequestTicketList
        showSubmitter
        emptyTitle="Nothing assigned yet"
        emptyBody="Requests assigned to you by an administrator will show up here."
      />
    </Layout>
  );
}
