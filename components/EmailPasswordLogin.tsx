'use client';
import {useEffect,useState} from 'react';
import type {FormEvent} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {DemoAccessLogin} from './DemoAccounts';
import {emailAccountRequest,hasEmailSession,signInEmail} from '@/lib/demo-email-auth';

const host=process.env.NEXT_PUBLIC_SUPABASE_URL||'',apiKey=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||'';

export default function EmailPasswordLogin(){
 const router=useRouter();
 const [email,setEmail]=useState(''),[password,setPassword]=useState(''),[visible,setVisible]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[ready,setReady]=useState(false);
 const [claim,setClaim]=useState({code:'',email:'',password:'',confirm:''}),[claimBusy,setClaimBusy]=useState(false),[claimError,setClaimError]=useState('');
 useEffect(()=>{setReady(hasEmailSession())},[]);
 async function login(e:FormEvent<HTMLFormElement>){e.preventDefault();setBusy(true);setError('');
  try{await signInEmail(email,password);await emailAccountRequest('auth_account');router.push('/dashboard');router.refresh();}
  catch(err){setError(err instanceof Error?err.message:'Email sign-in failed.');}
  finally{setBusy(false);}
 }
 async function claimOld(e:FormEvent<HTMLFormElement>){e.preventDefault();setClaimError('');
  if(claim.password!==claim.confirm){setClaimError('Passwords do not match.');return;}
  if(claim.password.length<12){setClaimError('Choose a password of at least 12 characters.');return;}
  setClaimBusy(true);
  try{
   if(!host||!apiKey)throw Error('Demo account service unavailable.');
   const response=await fetch(host+'/functions/v1/tftc-demo-auth',{method:'POST',headers:{'Content-Type':'application/json',apikey:apiKey},body:JSON.stringify({action:'claim_legacy_password',access_token:claim.code.trim(),email:claim.email.trim(),password:claim.password}),cache:'no-store'});
   const data=await response.json();if(!response.ok)throw Error(data.error||'Could not link the old demo account.');
   await signInEmail(claim.email,claim.password);await emailAccountRequest('auth_account');
   router.push('/dashboard');router.refresh();
  }catch(err){setClaimError(err instanceof Error?err.message:'Unable to link the account.');}
  finally{setClaimBusy(false);}
 }
 return <div className="tftc-auth-shell">
  <div className="panel tftc-email-login">
   <div className="eyebrow">CONTESTANT ACCOUNT</div><h2>Welcome back.</h2><p className="muted">Sign in with the fictional email and password created during your TFTC demonstration registration.</p>
   <form className="contestant-access-form" onSubmit={login}>
    <label htmlFor="tftc-email-login">Email address</label><input id="tftc-email-login" type="email" autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)} placeholder="singer@example.test" required/>
    <label htmlFor="tftc-password-login">Password</label><input id="tftc-password-login" type={visible?'text':'password'} autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} required minLength={12}/>
    <div className="actions"><button type="button" className="login-reveal" aria-pressed={visible} onClick={()=>setVisible(v=>!v)}>{visible?'Hide password':'Show password'}</button><button className="btn" type="submit" disabled={busy||!email.trim()||!password}>{busy?'Signing in…':'Sign in'}</button></div>
   </form>
   {error&&<p className="vote-alert vote-error" role="alert">{error}</p>}
   {ready&&<Link className="outline" href="/dashboard">Continue with saved session</Link>}
   <p className="muted">New to TFTC? <Link href="/register">Create a contestant account</Link></p>
   <p className="fine-print">This demo uses invented email addresses. No confirmation or password-reset email is sent. Production will have verified email delivery and secure password recovery.</p>
  </div>
  <details className="panel legacy-access-panel"><summary>Already registered with an earlier demo access code?</summary>
   <p className="muted">Keep your existing fictional contestant and link it to a new email/password account. This is optional for past testers.</p>
   <form className="contestant-access-form" onSubmit={claimOld}>
    <label htmlFor="legacy-code">Existing private demo access code</label><input id="legacy-code" type="password" required value={claim.code} onChange={e=>setClaim({...claim,code:e.target.value})} placeholder="xxxxxxxx-xxxx-4xxx-8xxx-xxxxxxxxxxxx" autoComplete="off"/>
    <label htmlFor="legacy-email">New fictional email</label><input id="legacy-email" type="email" required value={claim.email} onChange={e=>setClaim({...claim,email:e.target.value})} placeholder="previous-singer@example.test" autoComplete="email"/>
    <label htmlFor="legacy-password">New password</label><input id="legacy-password" type="password" required minLength={12} value={claim.password} onChange={e=>setClaim({...claim,password:e.target.value})} autoComplete="new-password"/>
    <label htmlFor="legacy-confirm">Confirm password</label><input id="legacy-confirm" type="password" required minLength={12} value={claim.confirm} onChange={e=>setClaim({...claim,confirm:e.target.value})} autoComplete="new-password"/>
    <button className="btn" type="submit" disabled={claimBusy}>{claimBusy?'Linking…':'Link my existing account'}</button>
   </form>
   {claimError&&<p role="alert" className="vote-alert vote-error">{claimError}</p>}
   <details className="legacy-direct-signin"><summary>Continue temporarily using only the old access code</summary><DemoAccessLogin/></details>
  </details>
 </div>;
}
