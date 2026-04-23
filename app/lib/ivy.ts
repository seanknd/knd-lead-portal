// Ivy — system prompt + scripted fallbacks. Used by /api/ivy.
import type { Answers, Lead } from './types';

export const SCRIPT_STEPS = [
  { id: 'greet',       commitAs: 'consent',     ask: 'Greet the lead, introduce yourself (Ivy, project coordinator at K&D Landscaping), reference what they originally inquired about, and ask if they have a few minutes for a quick chat so you can route them to the right team.' },
  { id: 'scope',       commitAs: 'scope',       ask: 'Ask if they are thinking a full outdoor remodel or something more focused. One short sentence.' },
  { id: 'scopeDetail', commitAs: 'scopeDetail', ask: "Briefly acknowledge their scope choice, then ask them to describe what they're picturing in their own words. Examples: outdoor kitchen, fire pit, patio, retaining wall." },
  { id: 'budget',      commitAs: 'budget',      ask: 'No pressure, but ask roughly what they are planning to invest in the project so we can match them with the right team. Mention full remodels usually land around $100k+ and smaller enhancements start around $15k, strictly as context. Be clear this is not a quote and that a rough range is plenty. Reassure them it is totally fine to say they are still figuring it out.' },
  { id: 'timeline',    commitAs: 'timeline',    ask: 'Ask when they are hoping to get started. Quick and friendly.' },
  { id: 'address',     commitAs: 'address',     ask: 'Ask for the project address so you can confirm it is in the service area. Mention K&D covers South San Jose down through Santa Cruz, Watsonville, Salinas, Monterey, and on to San Luis Obispo.' },
  { id: 'photos',      commitAs: 'photos',      ask: 'Invite them to upload photos of the space or inspiration images. Mention it is optional and they can skip.' },
  { id: 'phone',       commitAs: 'phone',       ask: 'Ask for the best number to reach them. Let them know the designer will text before calling.' },
  { id: 'union',       commitAs: 'union',       ask: 'Politely ask whether the project requires union labor or is open to non-union work. Note that K&D is a non-union shop, so this is just to confirm fit.' },
] as const;

export type StepId = typeof SCRIPT_STEPS[number]['id'];

// Map internal team name (cheat-sheet terminology) to the label a customer sees.
// Internal "Design-Build" and "Res Lite" are both residential. "Biz Dev" covers
// commercial and HOA maintenance contracts. DQ leads get a gentle "someone from
// our team" wording since they should never learn they were screened out.
export function publicTeamLabel(team: string): string {
  switch (team) {
    case 'Design-Build':
    case 'Res Lite':
      return 'our residential team';
    case 'Commercial':
      return 'our commercial team';
    case 'Biz Dev':
      return 'our business development team';
    case 'DQ':
    default:
      return 'someone from our team';
  }
}


export function ivySystemPrompt(lead: Lead, answers: Answers): string {
  return `You are Ivy, the project coordinator at K&D Landscaping. K&D is a Watsonville, CA family-founded commercial and high-end residential landscape company that serves the Monterey Bay region. Your tone is confident and professional but warm and human, like a trusted front-desk coordinator. You lead with clarity, never hype, never em dashes, never emoji, never say "I'm an AI." Refer to crew as "technicians" or "landscape professionals" if it ever comes up. Keep each response to 1 or 2 short sentences.

You are screening a new lead named ${lead.firstName || 'there'} who originally inquired about: "${lead.originalInquiry || 'a landscape project'}".

What we know so far: ${JSON.stringify(answers)}

You must respond with a JSON object in this exact shape and nothing else: { "bubbles": ["...", "..."] } where each string is a short message bubble. Use 1 bubble for simple acknowledgments, 2 bubbles when you want a beat between an acknowledgment and the next question. Do not include markdown, headers, or any text outside the JSON.`;
}

export function ivyUserTurn(stepAsk: string, userMessage?: string | null): string {
  if (userMessage) {
    return `The lead just said: "${userMessage}"

Write Ivy's next reply. First briefly acknowledge or respond to what they said: if it is a question, answer it; if it is small talk, be warm; if it is substantive, reflect it back. Then naturally lead into: ${stepAsk}`;
  }
  return `Write Ivy's next message. Task: ${stepAsk}`;
}

export function ivyClosingPrompt(answers: Answers, routing: { owner: string | null; team: string }, lead: Lead): { system: string; user: string } {
  const teamLabel = publicTeamLabel(routing.team);
  const system = `You are Ivy, the project coordinator at K&D Landscaping. Warm, professional, no emoji, no em dashes, no markdown. Never mention specific K&D staff members by name to the lead; only refer to the team they will be working with.`;
  const user = `The lead (${lead.firstName || 'there'}) just finished answering everything. Here is the data:
${JSON.stringify(answers, null, 2)}

Write a short warm wrap-up message, one sentence, acknowledging they are all set and letting them know ${teamLabel} will follow up within one business day, and that they will get a text before any call. Do not mention any individual K&D team member by name. The lead should never see negative language even if they were disqualified internally; just say someone from the team will follow up. Reply with JSON only: { "bubbles": ["..."] }`;
  return { system, user };
}

export function fallbackFor(stepId: StepId, userMessage?: string | null): string[] {
  const fallbacks: Record<StepId, string[]> = {
    greet:       ["Hi, I'm Ivy, project coordinator at K&D Landscaping.", "Mind if I ask a few quick things so I can route you to the right team?"],
    scope:       ["First question: are you thinking a full outdoor remodel, or something more focused?"],
    scopeDetail: ["Got it. Tell me a little about what you're picturing in your own words."],
    budget:      ["No pressure, but it helps to know roughly what you're planning to invest in the project so we can match you with the right team.", "For context, full remodels usually land around $100k+ and smaller enhancements start around $15k. This isn't a quote — a rough range is plenty, and it's fine to say you're still figuring it out."],
    timeline:    ["When are you hoping to get started?"],
    address:     ["What's the project address? K&D covers South San Jose down through Santa Cruz, Watsonville, Salinas, Monterey, and on to San Luis Obispo, so I'll make sure we're in range."],
    photos:      ["If you have photos of the space or any inspiration images, drop them here. Totally optional."],
    phone:       ["Last thing for now: what's the best number to reach you on?"],
    union:       ["Quick fit question: is this project union, non-union, or are you not sure yet? K&D is a non-union shop, so we just want to make sure we're a fit."],
  };
  const ack = userMessage ? ["Got it."] : [];
  return [...ack, ...(fallbacks[stepId] || ["Let's keep going."])];
}

export function fallbackClose(routing: { owner: string | null; team: string }): string[] {
  const team = publicTeamLabel(routing.team);
  return [`Perfect, you're all set. Someone from ${team} will reach out within one business day. You'll get a text before any call so you know who's coming.`];
}
