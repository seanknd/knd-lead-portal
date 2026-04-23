// Admin dashboard. Server-renders the list from the in-memory store, then
// hydrates a tiny client island for the active-row state and HubSpot button.

import AdminInbox from './AdminInbox';
import { listLeads } from '../lib/store';

export const dynamic = 'force-dynamic';   // always re-render with latest store
export const metadata = { title: 'Lead Inbox · K&D Landscaping' };

export default function AdminPage() {
  const leads = listLeads();
  return <AdminInbox initialLeads={leads} />;
}
