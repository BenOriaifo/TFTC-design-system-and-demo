// Run with: node --experimental-strip-types tests/auth-session-races.test.mjs
// Purely mocked Auth HTTP. Does not contact Supabase or create real accounts.
import assert from 'node:assert/strict';
process.env.NEXT_PUBLIC_SUPABASE_URL='https://mock.supabase.test';
process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY='sb_publishable_mock';
const { signInEmail, signOutEmail, getEmailAccessToken, hasEmailSession } = await import('../lib/demo-email-auth.ts');

const values=new Map();
globalThis.localStorage={
 getItem:key=>values.has(key)?values.get(key):null,
 setItem:(key,value)=>values.set(key,String(value)),
 removeItem:key=>values.delete(key)
};
const response=(body,status=200)=>({ok:status>=200&&status<300,json:async()=>body});
const session=(name,ttl=3600)=>({access_token:'access-'+name,refresh_token:'refresh-'+name,expires_in:ttl,user:{id:'user-'+name}});
function deferred(){let resolve;const promise=new Promise(r=>{resolve=r});return {promise,resolve};}
let refresh;
let refreshStarted;
globalThis.fetch=async(url,options)=>{
 const path=String(url);
 if(path.includes('grant_type=password')){
  const email=JSON.parse(options.body).email;
  return response(session(email.startsWith('a@')?'A':'B',email.startsWith('a@')?1:3600));
 }
 if(path.includes('grant_type=refresh_token')){
  refreshStarted?.();
  return refresh.promise;
 }
 if(path.endsWith('/auth/v1/logout'))return response({});
 throw new Error('Unexpected mocked network request: '+path);
};
function startRefresh(){refresh=deferred();let started;const notified=new Promise(r=>started=r);refreshStarted=started;return notified;}
function current(){return JSON.parse(values.get('tftc-demo-email-session-v1')||'null');}
async function pendingRefresh(){const signaled=startRefresh();await signInEmail('a@example.test','a-long-password1');const stale=current();stale.expires_at=Date.now()+1000;localStorage.setItem('tftc-demo-email-session-v1',JSON.stringify(stale));const pending=getEmailAccessToken();await signaled;return {pending};}

// Baseline: access token gets refreshed successfully when still the active session.
let {pending}=await pendingRefresh();
refresh.resolve(response(session('A-refreshed')));
assert.equal(await pending,'access-A-refreshed');
assert.equal(current().refresh_token,'refresh-A-refreshed');
console.log('PASS normal refresh');

// A second login must win even if the older refresh finishes after it.
({pending}=await pendingRefresh());
await signInEmail('b@example.test','another-long-password1');
refresh.resolve(response(session('A-stale')));
assert.equal(await pending,null);
assert.equal(current().access_token,'access-B');
assert.equal(await getEmailAccessToken(),'access-B');
console.log('PASS refresh cannot overwrite a new login');

// An old failed refresh must not clear a new user's valid session.
({pending}=await pendingRefresh());
await signInEmail('b@example.test','another-long-password1');
refresh.resolve(response({error:'invalid refresh token'},401));
assert.equal(await pending,null);
assert.equal(current().access_token,'access-B');
console.log('PASS stale refresh failure cannot erase another account');

// Logout must be final even if a prior refresh HTTP request is still in flight.
({pending}=await pendingRefresh());
await signOutEmail();
assert.equal(hasEmailSession(),false);
refresh.resolve(response(session('A-late')));
assert.equal(await pending,null);
assert.equal(hasEmailSession(),false);
console.log('PASS refresh cannot restore a logged-out account');
