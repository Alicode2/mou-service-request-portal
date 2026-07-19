import Layout from '../components/Layout';
import RequestTicketList from '../components/RequestTicketList';

export default function AdminRequests() {
  return (
    <Layout eyebrow="Administration" title="All Requests">
      <RequestTicketList
        showSubmitter
        emptyTitle="No requests match your filters"
        emptyBody="Try broadening your search or filters."
      />
    </Layout>
  );
}
