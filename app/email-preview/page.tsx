// Static reference render of the intake email a lead would receive.
// In production this content lives inside a HubSpot email template;
// this page is a pixel reference for the team to review and approve copy.

import { T } from '../lib/tokens';
import { KDLogo } from '../../components/KDLogo';

export const metadata = { title: 'Intake email · K&D Landscaping' };

export default function EmailPreviewPage() {
  const firstName = 'Sarah';
  const inquiry = 'a backyard remodel in Aptos';
  return (
    <div className="min-h-screen py-10 flex justify-center" style={{ background: T.creamDeep }}>
      <div className="w-full max-w-[640px] mx-4 shadow-card overflow-hidden" style={{ background: '#fff', borderRadius: 16, fontFamily: T.sans, color: T.ink }}>
        {/* mail header */}
        <div className="flex items-center gap-3 px-9 py-4" style={{ borderBottom: `1px solid ${T.lineSoft}` }}>
          <KDLogo size={32} />
          <div className="flex-1">
            <div className="text-[13px] font-medium">K&D Landscaping</div>
            <div className="text-[12px] mt-0.5" style={{ color: T.inkFaint }}>hello@kndlandscaping.com · to {firstName.toLowerCase()}.parker@gmail.com</div>
          </div>
          <div className="font-mono" style={{ fontSize: 11, color: T.inkFaint, letterSpacing: 0.3 }}>9:14 AM</div>
        </div>

        <div className="px-9 pt-11 pb-9">
          <div className="font-mono uppercase mb-3.5" style={{ fontSize: 10.5, color: T.forestThrive, letterSpacing: 1.5 }}>
            Next step for your project
          </div>
          <h1 className="font-display m-0" style={{ fontSize: 40, fontWeight: 700, letterSpacing: -1.2, color: T.oliveIntegrity, lineHeight: 1.1 }}>
            {firstName}, let's find<br />the right fit for<br /><span style={{ color: T.forestThrive }}>your yard.</span>
          </h1>
          <p className="text-[15px] mt-6 mb-6 leading-relaxed" style={{ color: T.inkSoft }}>
            Thanks for reaching out about your <strong style={{ color: T.ink }}>{inquiry}</strong>. Before we route you to a designer, our project coordinator Ivy will ask a few quick questions. Should take 3 to 4 minutes.
          </p>
          <p className="text-[15px] mb-8 leading-relaxed" style={{ color: T.inkSoft }}>
            This way, when our team reaches out, they already know your space, budget range, and timeline. No retreading the same ground twice.
          </p>

          <a href="#" className="inline-flex items-center gap-2.5 px-7 py-4 rounded-full text-[15px] font-medium no-underline" style={{ background: T.oliveIntegrity, color: T.cream, letterSpacing: -0.1 }}>
            Start prequalification
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M2 7h10M8 3l4 4-4 4" /></svg>
          </a>
          <div className="font-mono uppercase mt-3.5" style={{ fontSize: 10.5, color: T.inkFaint, letterSpacing: 0.5 }}>Secure link · expires in 7 days</div>

          <div className="mt-11 px-6 py-6 rounded-xl" style={{ background: T.cream }}>
            <div className="text-[13px] font-medium uppercase mb-3.5" style={{ color: T.ink, letterSpacing: 0.6 }}>
              What to expect
            </div>
            {[
              ['Scope & inspiration', "What you're picturing: remodel, patio, fire pit, drainage."],
              ['Budget range', 'A ballpark so we route you to the right team.'],
              ['Timeline & location', 'When, and where the project lives.'],
              ['Photos (optional)', 'A few snaps of the space so we can prep.'],
            ].map(([h, d], i) => (
              <div key={h} className="flex gap-4" style={{ paddingTop: i ? 14 : 0, marginTop: i ? 14 : 0, borderTop: i ? `1px solid ${T.lineSoft}` : 'none' }}>
                <div className="font-display" style={{ fontSize: 22, fontWeight: 700, color: T.forestThrive, lineHeight: 1, width: 28, letterSpacing: -0.5 }}>
                  {String(i + 1).padStart(2, '0')}
                </div>
                <div className="flex-1">
                  <div className="text-[14px] font-medium" style={{ color: T.ink, lineHeight: 1.2 }}>{h}</div>
                  <div className="text-[13px] mt-1" style={{ color: T.inkSoft, lineHeight: 1.4 }}>{d}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 pt-5 flex gap-3.5 items-start" style={{ borderTop: `1px solid ${T.lineSoft}` }}>
            <div className="rounded-full flex-shrink-0 flex items-center justify-center font-display" style={{ width: 40, height: 40, background: T.oliveIntegrity, color: T.cream, fontSize: 18 }}>J</div>
            <div className="text-[13px] leading-relaxed" style={{ color: T.inkSoft }}>
              <em className="font-display" style={{ fontStyle: 'italic', fontSize: 15, color: T.ink }}>"Looking forward to seeing what you're working with."</em>
              <br /><br />
              Justin White, CEO<br />
              <span style={{ color: T.inkFaint }}>K&D Landscaping · Raise the bar</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
