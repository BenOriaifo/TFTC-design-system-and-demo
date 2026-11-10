// Demo-only browser Auth client. Passwords are processed only by Supabase Auth.
const SESSION_KEY='tftc-demo-email-session-v1';
type Session={access_token:string;refresh_token:string;expires_at:number;user_id:string};
const base=process.env.NEXT_PUBLIC_SUPABASE_URL||'';
const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||'';
let refreshPromise:Promise<string|null>|null=null;
function headers(){if(!base||!key)throw Error('Email authentication is not configured.');return {'Content-Type':'application/json',apikey:key};}
function save(session:Record<string,unknown>){
 if(typeof session.access_token!=='string'||typeof session.refresh_token!=='string'||!session.access_token||!session.refresh_token)throw Error('Incomplete authentication session.');
 const expires=typeof session.expires_in==='number'?session.expires_in:3600;
 const stored:Session={access_token:session.access_token,refresh_token:session.refresh_token,expires_at:Date.now()+Math.max(60,expires)*1000,user_id:String((session.user as {id?:string}|undefined)?.id||'')};
 localStorage.setItem(SESSION_KEY,JSON.stringify(stored));return stored;
}
function read():Session|null{
 try{const v=localStorage.getItem(SESSION_KEY);if(!v)return null;const x=JSON.parse(v) as Session;if(!x?.access_token||!x?.refresh_token||!Number.isFinite(x.expires_at))return null;return x;}
 catch{return null;}
}
async function authToken(kind:'password'|'refresh_token',body:Record<string,unknown>,expectedRefreshToken?:string){
 const r=await fetch(base+'/auth/v1/token?grant_type='+kind,{method:'POST',headers:headers(),body:JSON.stringify(body),cache:'no-store'});
 let data:Record<string,unknown>={};try{data=await r.json()}catch{}
 if(!r.ok)throw Error(kind==='password'?'Incorrect email or password.': 'Your login session expired. Please sign in again.');
 // A delayed refresh must never restore a signed-out session or replace a newer login.
 if(expectedRefreshToken&&read()?.refresh_token!==expectedRefreshToken)throw Error('The login session changed while refreshing.');
 return save(data);
}
export async function signInEmail(email:string,password:string){
 const address=email.trim().toLowerCase();
 if(!address||!password)throw Error('Enter your email and password.');
 return authToken('password',{email:address,password});
}
export async function getEmailAccessToken():Promise<string|null>{
 const s=read();if(!s)return null;
 if(s.expires_at>Date.now()+60000)return s.access_token;
 if(!refreshPromise)refreshPromise=(async()=>{
  try{return (await authToken('refresh_token',{refresh_token:s.refresh_token},s.refresh_token)).access_token;}
  catch{
   // Only remove the failed session. Another sign-in may already have replaced it.
   if(read()?.refresh_token===s.refresh_token)localStorage.removeItem(SESSION_KEY);
   return null;
  }
 })().finally(()=>{refreshPromise=null});
 return refreshPromise;
}
export function hasEmailSession(){return !!read();}
export async function signOutEmail(){
 const s=read();
 localStorage.removeItem(SESSION_KEY);
 if(s&&base&&key){try{await fetch(base+'/auth/v1/logout',{method:'POST',headers:{...headers(),Authorization:'Bearer '+s.access_token},cache:'no-store',signal:AbortSignal.timeout(5000)});}catch{}}
}
export async function emailAccountRequest(action:'auth_account'|'auth_update_profile'|'auth_media_list'|'auth_media_submit',body:Record<string,unknown>={}){
 const jwt=await getEmailAccessToken();
 if(!jwt)throw Error('Please sign in using your email and password.');
 const r=await fetch(base+'/functions/v1/tftc-demo-auth',{method:'POST',headers:{...headers(),Authorization:'Bearer '+jwt},body:JSON.stringify({action,...body}),cache:'no-store'});
 let data:Record<string,unknown>={};try{data=await r.json()}catch{}
 if(!r.ok)throw Error(typeof data.error==='string'?data.error:'The email account service is not available.');
 return data;
}
