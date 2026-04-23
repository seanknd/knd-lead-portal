// Demo entry point for local testing.
// In production, leads arrive via /s/[token] from a signed HubSpot link.
// This page gives the team a quick way to exercise the full portal flow
// without needing a real HubSpot webhook round-trip.

import Link from 'next/link';
import PortalChat from '../components/PortalChat';
import { KDLogo } from '../components/KDLogo';

export default function Home() {
  return (
    <div className="min-h-screen">
      <div className="border-b border-black/5 bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 text-sm">
          <div className="flex items-center gap-2">
            <KDLogo />
            <span className="font-medium text-olive-integrity">
              Portal preview (demo)
            </span>
          </div>
          <nav className="flex items-center gap-4 text-grounded-black/60">
            <Link href="/" className="hover:text-olive-integrity">
              Portal
            </Link>
            <Link href="/admin" className="hover:text-olive-integrity">
              Admin inbox
            </Link>
            <Link href="/email-preview" className="hover:text-olive-integrity">
              Email preview
            </Link>
          </nav>
        </div>
      </div>

      <PortalChat
        lead={{
          firstName: 'Sarah',
          originalInquiry: 'a backyard remodel in Aptos',
          hubspotContactId: 'demo-0001',
        }}
      />
    </div>
  );
}
