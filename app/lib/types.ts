// Shared types for the K&D Lead Prequalification Portal.

export type ScopeChoice =
  | 'Full yard remodel'
  | 'Patio or outdoor living build'
  | 'Drainage / retaining wall'
  | 'Commercial or HOA project'
  | 'Something else';

export type TimelineChoice =
  | 'ASAP / this month'
  | '1-3 months'
  | '3-6 months'
  | 'Later this year'
  | "I'm flexible";

export type ConsentChoice = 'Sure, go ahead' | "I've only got a minute" | 'Maybe later';

export type UnionChoice = 'Non-union' | 'Union' | 'Not sure';

export interface BudgetAnswer {
  raw: number | null;       // dollars in $k, e.g. 75 means $75k
  label: string;            // "$75k"
  tier: string;             // "Partial yard"
}

export interface AddressAnswer {
  address: string;
  lat?: string | number;
  lon?: string | number;
}

export interface PhotoFile {
  name: string;
  size: number;
  type: string;
  kind: 'photo' | 'doc';
  url?: string | null;       // local object URL on client; remote URL after upload
  remoteUrl?: string;
}

export interface PhotosAnswer {
  files: PhotoFile[];
  skipped: boolean;
}

export interface Answers {
  consent?: ConsentChoice;
  scope?: ScopeChoice;
  scopeDetail?: string;
  budget?: BudgetAnswer;
  timeline?: TimelineChoice;
  address?: AddressAnswer;
  photos?: PhotosAnswer;
  phone?: string;
  union?: UnionChoice;       // only collected when scope = commercial / HOA
}

export interface Lead {
  firstName?: string;
  originalInquiry?: string;
  email?: string;
  hubspotContactId?: string;
}

export type RouteTeam = 'Design-Build' | 'Res Lite' | 'Commercial' | 'Biz Dev' | 'DQ';

export interface RoutingResult {
  team: RouteTeam;
  owner: string | null;
  confidence: number;
  reason: string;
  flags: string[];
  // checklist items showing which cheat-sheet rules passed/failed
  checks: RoutingCheck[];
}

export interface RoutingCheck {
  label: string;
  pass: boolean;
  needsHuman?: boolean;
}

export interface SubmissionPayload {
  lead: Lead;
  answers: Answers;
}

export interface SubmissionResult {
  id: string;
  routing: RoutingResult;
  closingMessage: string;
  receivedAt: string;
}

export interface StoredLead extends SubmissionResult {
  lead: Lead;
  answers: Answers;
}
