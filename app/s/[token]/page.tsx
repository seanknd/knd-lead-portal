// /s/[token] — token-gated portal entry.
// HubSpot workflow drops a link like https://portal.kndlandscaping.com/s/<jwt>
// into the follow-up email. We decode the JWT server-side to seed the chat
// with the first name and original inquiry, then render <PortalChat>.

import Link from 'next/link';
import PortalChat from '../../../components/PortalChat';
import { KDLogo } from '../../../components/KDLogo';
import { verifyLinkToken } from '../../lib/jwt';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function SignedLinkPage({
  params,
}: {
  params: { token: string };
}) {
  let payload: Awaited<ReturnType<typeof verifyLinkToken>> = null;

  try {
    payload = await verifyLinkToken(params.token);
  } catch {
    payload = null;
  }

  if (!payload) {
    return (
      <div className="min-h-screen bg-cream">
        <div className="mx-auto flex max-w-md flex-col items-center px-4 py-16 text-center">
          <KDLogo />
          <h1 className="mt-6 font-display text-2xl text-olive-integrity">
            This link has expired
          </h1>
          <p className="mt-3 text-sm text-grounded-black/70">
            For your security, portal links are valid for seven days. Reply to
            our last email and we will send you a fresh one right away.
          </p>
          <Link
            href="/"
            className="mt-6 rounded-full bg-forest-thrive px-5 py-2 text-sm font-medium text-white hover:bg-olive-integrity"
          >
            Back to K&D Landscaping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <PortalChat
      lead={{
        firstName: payload.firstName,
        originalInquiry: payload.originalInquiry,
        email: payload.email,
        hubspotContactId: payload.hubspotContactId,
      }}
    />
  );
}
