// Tokenized link helpers: HubSpot workflow hits /api/intake-webhook,
// which signs a JWT with the contactId + first name + original inquiry,
// returns a portal URL. The portal /s/[token] page decodes it and seeds
// the chat state.

import { SignJWT, jwtVerify } from 'jose';

interface LinkPayload {
  hubspotContactId: string;
  firstName: string;
  originalInquiry: string;
  email?: string;
}

function getSecret(): Uint8Array {
  const s = process.env.LINK_SIGNING_SECRET;
  if (!s) throw new Error('LINK_SIGNING_SECRET is not set');
  return new TextEncoder().encode(s);
}

export async function signLinkToken(payload: LinkPayload, expiresIn = '7d'): Promise<string> {
  return await new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(getSecret());
}

export async function verifyLinkToken(token: string): Promise<LinkPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return {
      hubspotContactId: String(payload.hubspotContactId || ''),
      firstName: String(payload.firstName || ''),
      originalInquiry: String(payload.originalInquiry || ''),
      email: payload.email ? String(payload.email) : undefined,
    };
  } catch {
    return null;
  }
}
