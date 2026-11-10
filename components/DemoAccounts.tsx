'use client';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {contestantUrl} from '@/lib/share-utils.mjs';
import {signInEmail,getEmailAccessToken,signOutEmail,hasEmailSession,emailAccountRequest} from '@/lib/demo-email-auth';
import {useEffect,useState} from 'react';import DemoMediaManager from './DemoMediaManager';import WithdrawAccount from './WithdrawAccount';

const TOKEN_KEY='tftc-demo-contestant-access-token';
const CODE_KEY='tftc-demo-contestant-code';
const categories=['Worship vocalist','Gospel songwriter','Praise vocalist','Contemporary worship','Inspirational vocalist'];
type DemoTransaction={reference:string;votes:number;amount_naira:number;status:'simulated_success'|'simulated_failure';created_at:string};
type Account={code:string;name:string;city:string;state:string;category:string;bio:string;status:string;votes:number;rank:number|null;supporter_transactions:number;simulated:boolean;transactions?:DemoTransaction[];created_at?:string};
type Receipt={code:string|null;status:'simulated_success'|'simulated_failure';reference:string;replayed:boolean;simulated:boolean};
const endpoint=process.env.NEXT_PUBLIC_SUPABASE_URL+'/functions/v1/tftc-demo-account';
const publicKey=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
async function demoRequest(payload:Record<string,unknown>){
  if(!process.env.NEXT_PUBLIC_SUPABASE_URL||!publicKey)throw new Error('Shared demo accounts are not configured yet.');
  const target=payload.action==='register_password'?endpoint.replace('tftc-demo-account','tftc-demo-auth'):endpoint;
  const response=await fetch(target,{method:'POST',headers:{'Content-Type':'application/json',apikey:publicKey},body:JSON.stringify(payload),cache:'no-store'});
  let data:Record<string,unknown>;
  try{data=await response.json();}catch{throw new Error('Demo account service returned an unexpected response.');}
  if(!response.ok)throw new Error(typeof data.error==='string'?data.error:'Demo account request failed.');
  return data;
}
function validAge(date:string){
 if(!date)return false;
 const dob=new Date(date+'T12:00:00');
 if(Number.isNaN(dob.getTime()))return false;
 const now=new Date();
 let age=now.getFullYear()-dob.getFullYear();
 if(now.getMonth()<dob.getMonth()||(now.getMonth()===dob.getMonth()&&now.getDate()<dob.getDate()))age--;
 return age>=18&&age<=110;
}

export function RegistrationDemo(){
 const router=useRouter();
 const [fullName,setFullName]=useState('');
 const [stageName,setStageName]=useState('');
 const [birthDate,setBirthDate]=useState('');
 const [city,setCity]=useState('Lagos');
 const [state,setState]=useState('Lagos');
 const [category,setCategory]=useState(categories[0]);
 const [email,setEmail]=useState('');
 const [phone,setPhone]=useState('');
 const [password,setPassword]=useState('');
 const [confirmPassword,setConfirmPassword]=useState('');
 const [bio,setBio]=useState('');
 const [agreed,setAgreed]=useState(false);
 const [busy,setBusy]=useState(false);
 const [receipt,setReceipt]=useState<Receipt|null>(null);
 const [accessCode,setAccessCode]=useState('');
 const [showConfirmation,setShowConfirmation]=useState(false);
 const [photoPreview,setPhotoPreview]=useState('');
 const [copied,setCopied]=useState('');
 const [error,setError]=useState('');
 useEffect(()=>()=>{if(photoPreview)URL.revokeObjectURL(photoPreview)},[photoPreview]);
 const progress=[fullName.trim(),stageName.trim(),birthDate,city.trim(),state.trim(),email.trim(),phone.trim(),password.length>=12,confirmPassword===password&&confirmPassword.length>=12,agreed].filter(Boolean).length;
 async function copyValue(value:string,label:string){try{await navigator.clipboard.writeText(value);setCopied(label+' copied.');}catch{setCopied('Copy manually: '+value);}}
 async function complete(success:boolean){
  setReceipt(null);setError('');setAccessCode('');setShowConfirmation(false);
  if(!validAge(birthDate)){setError('The fictional contestant must be 18 or older.');return;}
  if(!fullName.trim()||!stageName.trim()||!email.trim()||!phone.trim()||!agreed||!city.trim()||!state.trim()){
   setError('Complete all sample fields and agree to the demo content terms.');return;
  }
  if(!/^[^\s@]+@example\.(test|com|net|org)$/i.test(email.trim())){setError('Use a fictional email such as singer@example.test for the demonstration.');return;}
  if(password.length<12||password.length>72||!/[A-Za-z]/.test(password)||!/[0-9]/.test(password)){setError('Use a password of 12 to 72 characters containing letters and numbers.');return;}
  if(password!==confirmPassword){setError('Passwords do not match.');return;}
  if(!crypto?.randomUUID){setError('A recent browser is needed for this demo.');return;}
  const token=crypto.randomUUID();
  const reference=crypto.randomUUID();
  setBusy(true);
  try{
   const response=await demoRequest({
    action:success?'register_password':'register',reference,access_token:token,stage_name:stageName.trim(),
    city:city.trim(),state:state.trim(),category,bio:bio.trim(),
    age_confirmed:true,consent_agreed:agreed,simulate_success:success,
    ...(success?{email:email.trim().toLowerCase(),password}:{})
   }) as unknown as Receipt;
   setReceipt(response);
   if(response.status==='simulated_success'&&response.code){
    localStorage.removeItem(TOKEN_KEY);localStorage.removeItem(CODE_KEY);
    try{await signInEmail(email,password);setPassword('');setConfirmPassword('');}
    catch{setError('Registration succeeded, but automatic sign-in did not. Open Contestant Login and enter your new email and password.');}
    router.refresh();
   }
  }catch(e){setError(e instanceof Error?e.message:'Registration preview unavailable.');}
  finally{setBusy(false);}
 }
 return <div className="panel demo-registration">
 <div className="eyebrow">SIMULATED REGISTRATION · ₦2,000 DEMO ONLY</div>
 <h2>Create a fictional contestant.</h2>
 <p className="muted">Use invented details only. Your fictional email is securely stored with Supabase Authentication for sign-in; your password is handled by Supabase Auth, never stored by TFTC. Phone and birth date remain only in your browser. No payment occurs.</p>
 <div className="form-progress" role="status"><span>Registration details</span><strong>{progress} of 10 completed</strong><div className="progress-track"><i style={{width:(progress/10*100)+'%'}}/></div></div>
 <div className="registration-fields">
  <label>Full name (fictional)<input value={fullName} onChange={e=>setFullName(e.target.value)} placeholder="Ada Example" autoComplete="off"/></label>
  <label>Stage name <input value={stageName} onChange={e=>setStageName(e.target.value)} placeholder="Minister Demo Ada" maxLength={64}/></label>
  <label>Date of birth (fictional)<input type="date" value={birthDate} onChange={e=>setBirthDate(e.target.value)}/></label>
  <label>State <input value={state} onChange={e=>setState(e.target.value)} placeholder="Lagos" maxLength={60}/></label>
  <label>City <input value={city} onChange={e=>setCity(e.target.value)} placeholder="Lagos" maxLength={60}/></label>
  <label>Category <select value={category} onChange={e=>setCategory(e.target.value)}>{categories.map(c=><option key={c}>{c}</option>)}</select></label>
  <label>Email for login (fictional)<input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="singer@example.test" autoComplete="email"/></label>
  <label>Phone (fictional, browser-only)<input type="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="08000000000" autoComplete="off"/></label>
  <label>Choose password<input type="password" required minLength={12} maxLength={72} value={password} onChange={e=>setPassword(e.target.value)} placeholder="At least 12 characters" autoComplete="new-password"/></label>
  <label>Confirm password<input type="password" required minLength={12} maxLength={72} value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} placeholder="Repeat your password" autoComplete="new-password"/></label>
  <label className="field-wide">Short biography<textarea maxLength={280} rows={3} value={bio} onChange={e=>setBio(e.target.value)} placeholder="A fictional singer preparing for TFTC Live Show."/></label>
  <label className="field-wide">Optional fictional photo preview (not uploaded)<input type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>{const file=e.target.files?.[0];if(!file)return;if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>2*1024*1024){setError('Choose a JPG, PNG or WebP under 2 MB.');e.target.value='';return;}setError('');setPhotoPreview(old=>{if(old)URL.revokeObjectURL(old);return URL.createObjectURL(file);});}}/>{photoPreview&&<span className="local-photo-preview"><img src={photoPreview} alt="Local fictional photo preview, never uploaded"/></span>}<small>No image is stored in this demo. Production photo upload needs secure storage and review.</small></label>
 </div>
 <label className="consent"><input type="checkbox" checked={agreed} onChange={e=>setAgreed(e.target.checked)}/> I have read and agree to the <Link href="/agreement" target="_blank" rel="noopener noreferrer">TFTC Content &amp; Media Agreement (draft preview)</Link>. I am using only invented details.</label>
 <div className="vote-summary"><span>Sample registration charge</span><strong>₦2,000 · Simulated only</strong></div>
 <div className="vote-actions">
  <button type="button" className="btn" disabled={busy} onClick={()=>complete(true)}>{busy?'Processing…':'Simulate successful registration'}</button>
  <button type="button" className="outline" disabled={busy} onClick={()=>complete(false)}>Simulate failed checkout</button>
 </div>
 {error&&<p role="alert" className="vote-alert vote-error">{error}</p>}
 {receipt&&<div className={receipt.status==='simulated_success'?'vote-alert vote-success':'vote-alert vote-failure'} role="status">
  <strong>{receipt.status==='simulated_success'?'Your fictional registration is approved':'Simulated checkout failed. No contestant was registered.'}</strong>
  <p>Transaction reference: <code>{receipt.reference}</code></p>
  {receipt.code&&<><p>Contestant ID: <b>{receipt.code}</b></p>
  <p><strong>Your email and password are now your login credentials.</strong></p>
  <div className="actions"><button className="outline" type="button" onClick={()=>void copyValue(contestantUrl(receipt.code!),'Voting link')}>Copy my voting link</button><Link href="/login" className="outline">Contestant Login</Link></div>{copied&&<p className="fine-print" role="status">{copied}</p>}
  <p className="muted">Sign in using your fictional email and the password you created. No private access code is required for new registrations.</p>
  <div className="actions"><Link href="/dashboard" className="btn">Open my demo dashboard</Link><Link href={'/contestant/'+receipt.code} className="outline">View public profile</Link>
  <button type="button" className="outline registration-preview-trigger" onClick={()=>setShowConfirmation(v=>!v)}>{showConfirmation?'Hide confirmation previews':'Preview email and SMS'}</button>
  </div>
  {showConfirmation&&<div className="registration-confirmations">
   <div><h4>Sample registration email (not sent)</h4>
    <p><strong>Subject:</strong> Welcome to TFTC Live Show! Your Contestant ID is {receipt.code}</p>
    <p>Hi {fullName},</p><p>Your fictional registration for TFTC LIVE SHOW 2027 is confirmed.</p>
    <p>Stage name: {stageName}<br/>Contestant ID: {receipt.code}<br/>Status: Approved (demo)</p>
    <p>Public profile: {typeof window!=='undefined'?contestantUrl(receipt.code):'Your public TFTC contestant link'}</p>
    <p>Voting runs from 3 February to 2 March 2027. Finale: 14 March 2027.</p>
    <small>Preview only. No email was sent to {email}.</small>
   </div>
   <div><h4>Sample SMS (not sent)</h4><p>TFTC LIVE SHOW 2027 DEMO: Your registration is confirmed. Your fictional contestant ID is {receipt.code}. Share your public voting profile to invite supporters.</p><small>Preview only. No SMS was sent to {phone}.</small></div>
  </div>}</>}
 </div>}
 <p className="fine-print">Demo registration does not collect money or approve a real competitor. Public fictional profiles can be seen by other visitors. Keep personal information out of this test.</p>
 </div>;
}

export function DemoAccessLogin(){
 const router=useRouter();
 const [token,setToken]=useState('');
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const [ready,setReady]=useState(false);
 const [show,setShow]=useState(false);
 useEffect(()=>setReady(!!localStorage.getItem(TOKEN_KEY)),[]);
 async function login(){
  setBusy(true);setError('');
  try{
    await demoRequest({action:'login',access_token:token.trim()});
    localStorage.setItem(TOKEN_KEY,token.trim());
    router.push('/dashboard');
    router.refresh();
  }catch(e){setError(e instanceof Error?e.message:'Cannot open demo account.');}
  finally{setBusy(false);}
 }
 return <div className="panel demo-login">
  <h2>My registered demo contestant</h2>
  <p className="muted">Use the unique access code shown after a simulated registration. These are prototype access codes, not production passwords.</p>
  <form className="contestant-access-form" onSubmit={e=>{e.preventDefault();void login();}}>
   <label htmlFor="tftc-contestant-code">Demo access code</label><input id="tftc-contestant-code" type={show?'text':'password'} value={token} onChange={e=>setToken(e.target.value)} placeholder="xxxxxxxx-xxxx-4xxx-8xxx-xxxxxxxxxxxx" autoComplete="off" autoCapitalize="off" spellCheck={false} aria-invalid={!!error} required/>
   <div className="actions"><button className="login-reveal" type="button" onClick={()=>setShow(s=>!s)} aria-pressed={show}>{show?'Hide access code':'Show access code'}</button><button type="submit" className="btn" disabled={busy||!token.trim()}>{busy?'Checking…':'Open contestant dashboard'}</button></div>
  </form>
  {ready&&<div className="actions"><Link className="outline" href="/dashboard">Use saved browser access</Link></div>}
  {error&&<p role="alert" className="vote-alert vote-error">{error}</p>}
 </div>;
}
export function MyDemoDashboard(){
 const router=useRouter();
 const [account,setAccount]=useState<Account|null>(null);
 const [pending,setPending]=useState(true);
 const [error,setError]=useState('');
 const [message,setMessage]=useState('');
 const [activeTab,setActiveTab]=useState<'overview'|'activity'|'profile'|'media'>('overview');
 const [editing,setEditing]=useState(false);
 const [saving,setSaving]=useState(false);
 const [draft,setDraft]=useState({name:'',city:'',state:'',category:categories[0],bio:''});
 useEffect(()=>{
  let cancelled=false;
  const refresh=async()=>{
   try{
    const jwt=await getEmailAccessToken();
    const legacy=jwt?null:localStorage.getItem(TOKEN_KEY);
    if(!jwt&&!legacy)throw Error('No email session found. Please sign in using your email and password.');
    const result=(jwt?await emailAccountRequest('auth_account'):await demoRequest({action:'login',access_token:legacy})) as unknown as Account;
    if(!cancelled){setAccount(result);setError('');}
   }catch(e){if(!cancelled)setError(e instanceof Error?e.message:'Could not read the account.');}
   finally{if(!cancelled)setPending(false);}
  };
  void refresh();
  const timer=window.setInterval(()=>{if(document.visibilityState==='visible')void refresh()},15000);
  return ()=>{cancelled=true;window.clearInterval(timer)};
 },[]);
 const logout=async()=>{await signOutEmail();localStorage.removeItem(TOKEN_KEY);localStorage.removeItem(CODE_KEY);router.push('/login');router.refresh();};
 const startEdit=()=>{
  if(!account||account.status!=='approved')return;
  setDraft({name:account.name,city:account.city,state:account.state,category:account.category,bio:account.bio});
  setEditing(true);setActiveTab('profile');setError('');setMessage('');
 };
 async function saveProfile(){
  if(account?.status!=='approved'){setError('Withdrawn or inactive accounts cannot edit their public profile.');return;}
  const jwt=await getEmailAccessToken();
  const token=jwt?null:localStorage.getItem(TOKEN_KEY);
  if(!jwt&&!token){setError('Sign in to edit your profile.');return;}
  if(!draft.name.trim()||!draft.city.trim()||!draft.state.trim()||!draft.category){
   setError('Complete the public fictional profile fields.');return;
  }
  setSaving(true);setError('');setMessage('');
  try{
   const payload={stage_name:draft.name.trim(),city:draft.city.trim(),state:draft.state.trim(),category:draft.category,bio:draft.bio.trim()};
   if(jwt)await emailAccountRequest('auth_update_profile',payload);
   else await demoRequest({action:'update_profile',access_token:token,...payload});
   const updated=(jwt?await emailAccountRequest('auth_account'):await demoRequest({action:'login',access_token:token})) as unknown as Account;
   setAccount(updated);setEditing(false);setMessage('Your fictional public profile has been saved to the shared demo database.');
   router.refresh();
  }catch(e){setError(e instanceof Error?e.message:'Could not save the fictional profile.');}
  finally{setSaving(false);}
 }
 async function copyVotingLink(){
  if(!account||account.status!=='approved')return;
  const link=contestantUrl(account.code);
  try{await navigator.clipboard.writeText(link);setMessage('Shareable voting profile link copied.');}
  catch{setMessage('You can copy your voting profile URL: '+link);}
 }
 async function refreshAfterWithdrawal(){
  const jwt=await getEmailAccessToken();
  const legacy=jwt?null:localStorage.getItem(TOKEN_KEY);
  if(!jwt&&!legacy)throw Error('The withdrawal was saved, but your login session expired. Please sign in again.');
  const updated=(jwt?await emailAccountRequest('auth_account'):await demoRequest({action:'login',access_token:legacy})) as unknown as Account;
  if(updated.status!=='withdrawn')throw Error('Unable to confirm archived status. Refresh your dashboard.');
  setAccount(updated);setEditing(false);setActiveTab('profile');
  setMessage('Your profile is archived. Previous demo votes and transactions are retained.');
  router.refresh();
 }
 const fmt=(n:number)=>n.toLocaleString('en-NG');
 if(pending)return <div className="panel"><p>Loading your fictional contestant account…</p></div>;
 if(error&&!account)return <div className="panel"><p role="alert">{error}</p><Link className="btn" href="/login">Sign in with email and password</Link></div>;
 if(!account)return <div className="panel">No fictional contestant account loaded.</div>;
 const history=account.transactions||[];
 const regDate=account.created_at?new Date(account.created_at).toLocaleDateString('en-NG',{day:'numeric',month:'long',year:'numeric'}):'Not available';
 return <div className="contestant-dashboard">
  <div className="row-buttons">
   <div>
    <div className="eyebrow">PERSONAL CONTESTANT PREVIEW</div>
    <h2>Welcome, {account.name}.</h2>
    <p className="muted">{account.code} · {account.city}, {account.state} · <strong>{account.status}</strong></p>
   </div>
   <div className="actions">{account.status==='approved'&&<button className="outline" type="button" onClick={copyVotingLink}>Copy voting link</button>}<button className="outline" type="button" onClick={logout}>Sign out of demo</button></div>
  </div>
  <div className="stats dashboard-stats">
   <div><small>My credited votes</small><strong>{fmt(account.votes)}</strong></div>
   <div><small>Current rank</small><strong>{account.rank===null?'Not ranked':'#'+account.rank}</strong></div>
   <div><small>Successful vote transactions</small><strong>{fmt(account.supporter_transactions)}</strong></div>
   <div><small>Contestant ID</small><strong>{account.code}</strong></div>
  </div>
  {error&&<div className="vote-alert vote-error" role="alert">{error}</div>}
  {message&&<div className="vote-alert vote-success" role="status">{message}</div>}
  <div className="dashboard-tabs" aria-label="Contestant dashboard sections">
   <button type="button" aria-pressed={activeTab==='overview'} className={activeTab==='overview'?'current':''} onClick={()=>setActiveTab('overview')}>Overview</button>
   <button type="button" aria-pressed={activeTab==='activity'} className={activeTab==='activity'?'current':''} onClick={()=>setActiveTab('activity')}>Voting activity</button>
   <button type="button" aria-pressed={activeTab==='profile'} className={activeTab==='profile'?'current':''} onClick={()=>setActiveTab('profile')}>My profile</button><button type="button" aria-pressed={activeTab==='media'} className={activeTab==='media'?'current':''} onClick={()=>setActiveTab('media')}>My media</button>
  </div>
  {activeTab==='overview'&&<>
   <div className="dashboard-columns">
    <section className="panel account-detail">
     <div className="eyebrow">COMPETITION STATUS</div><h3>My journey toward the crown.</h3>
     <div className="dashboard-info-row"><span>Participation</span><strong>{account.status==='approved'?'Eligible fictional contestant':account.status}</strong></div>
     <div className="dashboard-info-row"><span>Leaderboard</span><strong>{account.rank&&account.rank<=20?'Within provisional Top 20':account.rank?'Below Top 20 cutoff':'Not eligible'}</strong></div>
     <div className="dashboard-info-row"><span>Registration date</span><strong>{regDate}</strong></div>
     <div className="dashboard-info-row"><span>Successful mock purchases</span><strong>{fmt(account.supporter_transactions)}</strong></div>
    </section>
    <section className="panel account-detail">
     <div className="eyebrow">SHARE YOUR PROFILE</div><h3>Invite support for your journey.</h3>
     {account.status==='approved'?<>
     <p className="muted">Share your public contestant page. Supporters can simulate the six voting packages, and your dashboard reflects credited test votes.</p>
     <div className="actions"><button className="btn" type="button" onClick={copyVotingLink}>Copy my voting link</button><Link className="outline" href={'/contestant/'+account.code}>View public page</Link></div>
     </>:<p className="muted">This account is not publicly listed and can no longer receive votes.</p>}
     <p className="fine-print">Shared test votes are not proof of real payments or verified competition eligibility.</p>
    </section>
   </div>
   <div className="dashboard-overview-actions"><button type="button" className="outline" onClick={()=>setActiveTab('activity')}>View voting activity</button>{account.status==='approved'&&<><button type="button" className="outline" onClick={startEdit}>Edit fictional profile</button><button type="button" className="outline" onClick={()=>setActiveTab('media')}>Manage performance links</button></>}<Link className="outline" href="/leaderboard">Open leaderboard</Link></div>
  </>}
  {activeTab==='media'&&(account.status==='approved'?<DemoMediaManager/>:<section className="panel dashboard-panel"><h3>Media submissions archived</h3><p className="muted">No new performance links while withdrawn or inactive. Previous submissions remain available to staff.</p></section>)}
  {activeTab==='activity'&&<section className="panel dashboard-panel">
   <div className="eyebrow">MY SUPPORTER VOTE HISTORY</div><h3>Recent simulated transactions.</h3>
   <p className="muted">This history shows test purchases credited or declined for your fictional contestant, not individual supporters or their personal information. Up to 30 recent attempts are shown.</p>
   {history.length?
    <div className="table-scroll"><table className="dashboard-transactions"><thead><tr><th>Demo date</th><th>Vote bundle</th><th>Mock amount</th><th>Status</th><th>Reference</th></tr></thead><tbody>{history.map(tx=><tr key={tx.reference}>
     <td>{new Date(tx.created_at).toLocaleString('en-NG')}</td>
     <td>{tx.votes} {tx.votes===1?'vote':'votes'}</td>
     <td>₦{fmt(tx.amount_naira)}</td>
     <td><span className={tx.status==='simulated_success'?'tx-success':'tx-failed'}>{tx.status==='simulated_success'?'Credited':'Declined'}</span></td>
     <td><code>{tx.reference.slice(0,8)}…</code></td>
    </tr>)}</tbody></table></div>
   :<div className="dashboard-empty"><strong>No simulated voting transactions yet.</strong><p>Share your public profile and try a fictional vote to see activity here.</p></div>}
   <p className="fine-print">One purchase can contain multiple votes. The transaction count is not necessarily the number of unique supporters.</p>
  </section>}
  {activeTab==='profile'&&<section className="panel dashboard-panel">
   <div className="dashboard-profile-heading"><div><div className="eyebrow">MY PUBLIC DETAILS</div><h3>Profile information.</h3></div>{!editing&&account.status==='approved'&&<button type="button" className="btn" onClick={startEdit}>Edit profile</button>}</div>
   {editing?
    <div className="dashboard-edit-form">
     <label>Fictional stage name<input maxLength={64} value={draft.name} onChange={e=>setDraft(v=>({...v,name:e.target.value}))}/></label>
     <label>City<input maxLength={60} value={draft.city} onChange={e=>setDraft(v=>({...v,city:e.target.value}))}/></label>
     <label>State<input maxLength={60} value={draft.state} onChange={e=>setDraft(v=>({...v,state:e.target.value}))}/></label>
     <label>Category<select value={draft.category} onChange={e=>setDraft(v=>({...v,category:e.target.value}))}>{categories.map(c=><option key={c}>{c}</option>)}</select></label>
     <label className="field-wide">Fictional biography<textarea rows={4} maxLength={280} value={draft.bio} onChange={e=>setDraft(v=>({...v,bio:e.target.value}))}/></label>
     <div className="actions field-wide"><button className="btn" disabled={saving} type="button" onClick={saveProfile}>{saving?'Saving…':'Save demo changes'}</button><button className="outline" disabled={saving} type="button" onClick={()=>{setEditing(false);setError('');}}>Cancel</button></div>
    </div>
   :<div className="dashboard-profile-preview">
     <div className="dashboard-info-row"><span>Stage name</span><strong>{account.name}</strong></div>
     <div className="dashboard-info-row"><span>City / state</span><strong>{account.city}, {account.state}</strong></div>
     <div className="dashboard-info-row"><span>Category</span><strong>{account.category}</strong></div>
     <div className="dashboard-info-row"><span>Registration ID</span><strong>{account.code}</strong></div>
     <div className="dashboard-info-row"><span>Sample biography</span><strong>{account.bio||'No sample biography yet'}</strong></div>
     {account.status==='approved'&&<div className="actions"><Link href={'/contestant/'+account.code} className="outline">Open public profile</Link></div>}
    </div>}
   <p className="fine-print">The name, city, state, category and biography are public fictional details. Vote counts, rankings and status cannot be edited by contestants.</p>
  </section>}
  {activeTab==='profile'&&<WithdrawAccount code={account.code} name={account.name} status={account.status} onWithdraw={refreshAfterWithdrawal}/>}
  <p className="fine-print">Access-code login is for an interactive prototype. A real competition must use stronger individual authentication and permission controls.</p>
 </div>;
}
