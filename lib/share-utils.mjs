export const SITE_ORIGIN = 'https://tftc-platform-dev.vercel.app';
export function normaliseContestantCode(value) {
  const code = String(value ?? '').trim().toUpperCase();
  return /^TFTC-[0-9]{4}$/.test(code) ? code : null;
}
export function contestantUrl(code, origin = SITE_ORIGIN) {
  const safe = normaliseContestantCode(code);
  if (!safe) throw new TypeError('Invalid TFTC contestant code');
  const site = new URL(origin);
  if (site.protocol !== 'https:' && site.hostname !== 'localhost') throw new TypeError('HTTPS origin required');
  return new URL('/contestant/' + safe, site.origin).toString();
}
export function contestantShareText(name, code) {
  const safe = normaliseContestantCode(code);
  if (!safe || !String(name ?? '').trim()) throw new TypeError('Valid contestant required');
  return 'Meet ' + String(name).trim() + ' (' + safe + ') on TFTC Live Show 2027. Explore their story and try a fictional supporter vote. No real payments.';
}
export function contestantPreview(name, code, category, city) {
  const safe = normaliseContestantCode(code);
  if (!safe || !String(name ?? '').trim()) throw new TypeError('Valid contestant required');
  const title = String(name).trim() + ' | TFTC Live Show 2027';
  const details = [category, city].map(s => String(s || '').trim()).filter(Boolean).join(' · ');
  const description = String(name).trim() + ' (' + safe + ')' + (details ? ' · ' + details : '') + '. Explore this fictional contestant, approved performances and demo supporter voting. No real payments.';
  return {title, description, url: contestantUrl(safe), imageUrl: SITE_ORIGIN + '/api/social-card?code=' + safe};
}
