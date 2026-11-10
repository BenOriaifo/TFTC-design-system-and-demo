import test from 'node:test';
import assert from 'node:assert/strict';
const base=process.env.TFTC_TEST_BASE;
const routes=['/','/contestants','/leaderboard','/finalists','/register','/login','/admin/login','/rules','/privacy','/contact','/contestant/TFTC-0014'];
function origin(){const url=new URL(base);if(url.protocol!=='https:'||!url.hostname.endsWith('.vercel.app'))throw new Error('Approved Vercel preview URL required');return url;}
test('development preview routes respond without Vercel Authentication',{skip:!base},async()=>{
 const url=origin();
 for(const pathname of routes){const r=await fetch(new URL(pathname,url),{redirect:'manual'});assert.equal(r.status,200,pathname);const html=await r.text();assert.match(html,/TFTC/i);assert.doesNotMatch(html,/Authentication Required/);}
});
test('unique social metadata and generated picture respond',{skip:!base},async()=>{
 const url=origin();
 const r=await fetch(new URL('/contestant/TFTC-0014',url));const html=await r.text();
 assert.match(html,/property="og:title"/);assert.match(html,/Minister Amara/);assert.match(html,/property="og:image"/);
 const image=await fetch(new URL('/api/social-card?code=TFTC-0014',url));
 assert.equal(image.status,200);assert.match(image.headers.get('content-type')||'',/image\/png/);
 const bad=await fetch(new URL('/api/social-card?code=bad',url));assert.equal(bad.status,404);
});

test('new contestant authentication screens require email and password',{skip:!base},async()=>{
 const url=origin();
 const login=await (await fetch(new URL('/login',url))).text();
 const register=await (await fetch(new URL('/register',url))).text();
 assert.ok(login.includes('tftc-email-login'));
 assert.ok(login.includes('tftc-password-login'));
 assert.ok(login.includes('autocomplete="username"')||login.includes('autoComplete'));
 assert.ok(register.includes('Choose password'));
 assert.ok(register.includes('Confirm password'));
 assert.ok(register.includes('example.test'));
});
