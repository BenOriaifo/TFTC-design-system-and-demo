'use client';
import {useCallback,useEffect,useState} from 'react';
import {useRouter} from 'next/navigation';
import AdminReports from './AdminReports';import AdminMedia from './AdminMedia';

const SESSION_KEY='tftc-demo-staff-access-code';
type Overview={
 contestants:number;active:number;disqualified:number;total_votes:number;
 mock_vote_revenue:number;mock_registration_revenue:number;mock_vote_transactions:number;
 phase:'registration'|'voting'|'finale';frozen:boolean;registration_frozen:boolean
};
type Entry={code:string;name:string;city:string;category:string;votes:number;status:string;seeded:boolean;bio:string;state:string};
type Transaction={reference:string;name:string;code:string;votes:number;amount:number;status:string;created_at:string};
type Activity={action:string;details:Record<string,unknown>;created_at:string};

async function callAdmin<T>(token:string,action:string,payload:Record<string,unknown>={}):Promise<T>{
 const host=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!host||!key)throw new Error('Demo administrator service is not configured.');
 const resp=await fetch(host+'/functions/v1/tftc-demo-admin',{
  method:'POST',headers:{'Content-Type':'application/json',apikey:key},
  body:JSON.stringify({access_code:token,action,payload}),cache:'no-store'
 });
 const d:Record<string,unknown>=await resp.json();
 if(!resp.ok)throw new Error(typeof d.error==='string'?d.error:'Staff demonstration request failed.');
 return d.result as T;
}

export function DemoAdmin(){
 const router=useRouter();
 const [input,setInput]=useState('');
 const [showAccessCode,setShowAccessCode]=useState(false);
 const [token,setToken]=useState('');
 const [overview,setOverview]=useState<Overview|null>(null);
 const [entries,setEntries]=useState<Entry[]>([]);
 const [txs,setTxs]=useState<Transaction[]>([]);
 const [activity,setActivity]=useState<Activity[]>([]);
 const [loading,setLoading]=useState(false);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const [notice,setNotice]=useState('');
 const [query,setQuery]=useState('');
 const [editing,setEditing]=useState<Entry|null>(null);
 const [editName,setEditName]=useState('');
 const [editCity,setEditCity]=useState('');
 const [editBio,setEditBio]=useState('');
 const [reason,setReason]=useState('Client demonstration');
 const [view,setView]=useState<'overview'|'contestants'|'votes'|'media'|'reports'|'activity'>('overview');

 const load=useCallback(async(secret:string)=>{
  setLoading(true);setError('');
  try{
   const [ov,people,transactions,history]=await Promise.all([
    callAdmin<Overview>(secret,'overview'),
    callAdmin<Entry[]>(secret,'contestants'),
    callAdmin<Transaction[]>(secret,'transactions'),
    callAdmin<Activity[]>(secret,'activity')
   ]);
   setOverview(ov);setEntries(people);setTxs(transactions);setActivity(history);setToken(secret);return true;
  }catch(e){setError(e instanceof Error?e.message:'Admin preview unavailable.');return false;}
  finally{setLoading(false);}
 },[]);
 useEffect(()=>{
  const saved=sessionStorage.getItem(SESSION_KEY);
  if(saved)void load(saved).then(valid=>{if(!valid)sessionStorage.removeItem(SESSION_KEY);});
 },[load]);
 const signIn=async()=>{
  const v=input.trim().toLowerCase();
  if(!v){setError('Enter the private staff demo access code.');return;}
  const valid=await load(v);
  if(valid){sessionStorage.setItem(SESSION_KEY,v);setInput('');router.push('/admin');}
 };
 const signOut=()=>{sessionStorage.removeItem(SESSION_KEY);setToken('');setOverview(null);setEntries([]);router.push('/admin/login');};
 const perform=async(action:string,payload:Record<string,unknown>,label:string)=>{
  if(!token)return;
  if(['set_status','set_phase','set_frozen','set_registration_frozen'].includes(action)){
   if(!reason.trim()){setError('Please enter a reason for this demo change.');return false;}
   if(!window.confirm('Apply this fictional competition change? '+label))return false;
  }
  setBusy(true);setNotice('');setError('');
  try{
   await callAdmin(token,action,payload);
   setNotice(label);
   await load(token);
   router.refresh();
   return true;
  }catch(e){setError(e instanceof Error?e.message:'Could not save demo change.');return false;}
  finally{setBusy(false);}
 };
 const startEdit=(c:Entry)=>{setEditing(c);setEditName(c.name);setEditCity(c.city);setEditBio(c.bio||'');};
 const saveEdit=async()=>{
  if(!editing)return;
  if(!editName.trim()||!editCity.trim()){setError('Complete the stage name and city.');return;}
  const saved=await perform('edit_profile',{code:editing.code,name:editName,city:editCity,bio:editBio},'Fictional contestant profile updated.');
  if(saved)setEditing(null);
 };
 const exportData=()=>{
  const out={demo:true,exported_at:new Date().toISOString(),overview,contestants:entries,transactions:txs,activity};
  const url=URL.createObjectURL(new Blob([JSON.stringify(out,null,2)],{type:'application/json'}));
  const a=document.createElement('a');a.href=url;a.download='tftc-demo-studio-export.json';a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
 };
 const filtered=entries.filter(c=>(c.name+' '+c.city+' '+c.code+' '+c.status).toLowerCase().includes(query.toLowerCase()));
 if(!token)return <div className="staff-login-shell"><div className="staff-login-intro"><div className="eyebrow">TFTC STAFF STUDIO</div><h1>Competition control center.</h1><p className="muted">Manage fictional contestants, simulated votes, external media submissions and financial reports.</p><span className="media-status media-status-pending">Reviewer access · demo only</span></div><div className="panel staff-login">
  <div className="eyebrow">TFTC STAFF STUDIO · FICTIONAL DEMO</div>
  <h2>Staff sign-in.</h2>
  <p className="muted">The management demonstration has its own access code. It is separate from the public contestant pages and is not a production administrator account.</p>
  <form className="staff-access-form" onSubmit={e=>{e.preventDefault();void signIn();}}>
   <label htmlFor="tftc-staff-demo-code">Private staff demo access code</label>
   <input id="tftc-staff-demo-code" autoComplete="off" autoCapitalize="off" spellCheck={false} type={showAccessCode?'text':'password'} placeholder="Enter the private code" value={input} onChange={e=>setInput(e.target.value)} required aria-invalid={!!error}/>
   <div className="actions"><button type="button" className="login-reveal" onClick={()=>setShowAccessCode(v=>!v)} aria-pressed={showAccessCode}>{showAccessCode?'Hide code':'Show code'}</button><button type="submit" className="btn" disabled={loading||!input.trim()}>{loading?'Checking…':'Enter demo studio'}</button></div>
  </form>
  {error&&<div className="vote-alert vote-error" role="alert">{error}</div>}
  <p className="fine-print">The private code is never displayed on this public page. Admin actions are logged and affect fictional demonstration data only.</p>
 </div></div>;
 return <div className="admin-studio">
  <div className="row-buttons"><div><div className="eyebrow">STAFF DEMONSTRATION · SHARED DATABASE</div><h2>Competition overview.</h2><p className="muted">All numbers below are fictional or simulated. There are no payment gateways.</p><p className="muted">Review phase: {overview?.phase||'Loading'} · Voting {overview?.frozen?'frozen':'not frozen'} · Registration {overview?.registration_frozen?'paused':'available for mock checkout'}</p></div>
   <div className="actions"><button type="button" className="outline" disabled={loading||busy} onClick={()=>load(token)}>Refresh</button><button type="button" className="outline" onClick={signOut}>Sign out</button></div>
  </div>
  <nav className="admin-view-tabs" aria-label="Staff studio sections">{([['overview','Overview'],['contestants','Contestants'],['votes','Transactions'],['media','Media review'],['reports','Reports & exports'],['activity','Audit history']] as const).map(([id,label])=><button type="button" key={id} aria-pressed={view===id} className={view===id?'active':''} onClick={()=>setView(id)}>{label}</button>)}</nav>
  {error&&<div className="vote-alert vote-error" role="alert">{error}</div>}
  {notice&&<div className="vote-alert vote-success" role="status">{notice}</div>}
  {view==='overview'&&overview&&<>
   <div className="stats"><div><small>Active contestants</small><strong>{overview.active} / 2,000</strong></div><div><small>Mock credited votes</small><strong>{overview.total_votes.toLocaleString('en-NG')}</strong></div><div><small>Simulated voting revenue</small><strong>₦{overview.mock_vote_revenue.toLocaleString('en-NG')}</strong></div><div><small>Simulated registration revenue</small><strong>₦{overview.mock_registration_revenue.toLocaleString('en-NG')}</strong></div></div>
   <div className="panel studio-controls"><h3>Competition controls</h3>
    <p className="muted">Changes below affect the shared fictional preview across devices. They are logged with the reason you enter.</p>
    <label className="staff-reason">Reason for changing demo settings<input maxLength={200} value={reason} onChange={e=>setReason(e.target.value)} placeholder="Why are you changing the preview?" /></label>
    <div className="control-row">
    <label>Demo competition phase
      <select disabled={busy} value={overview.phase} onChange={e=>perform('set_phase',{phase:e.target.value,reason},'Competition phase updated.')}>
       <option value="registration">Registration preview</option><option value="voting">Voting preview</option><option value="finale">Grand finale preview</option>
      </select>
    </label>
    <label className="freeze-label"><input disabled={busy} type="checkbox" checked={overview.frozen} onChange={e=>perform('set_frozen',{frozen:e.target.checked,reason},e.target.checked?'Demo voting frozen.':'Demo voting resumed.')}/> Freeze all demo voting</label>
    <label className="freeze-label"><input disabled={busy} type="checkbox" checked={overview.registration_frozen} onChange={e=>perform('set_registration_frozen',{frozen:e.target.checked,reason},e.target.checked?'Demo registrations paused.':'Demo registrations resumed.')}/> Pause new demo registrations</label>
    <span className="muted">A voting freeze or non-voting phase blocks new mock votes. Registration has its own pause switch.</span>
   </div></div>
  </>}
  {view==='contestants'&&<div className="panel studio-section"><div className="row-buttons"><div><h3>Contestant manager</h3><p className="muted">Disqualify, suspend, restore, or edit a fictional contestant. Public rankings exclude ineligible contestants.</p></div><input className="staff-search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search contestants" /></div>
   <div className="table-scroll"><table><thead><tr><th>ID</th><th>Contestant</th><th>Votes</th><th>Status</th><th>Actions</th></tr></thead><tbody>
    {filtered.map(c=><tr key={c.code}><td>{c.code}</td><td><strong>{c.name}</strong><small>{c.city}</small></td><td>{c.votes.toLocaleString()}</td><td>{c.status}</td><td><div className="table-actions">
      <button disabled={busy} onClick={()=>startEdit(c)}>Edit</button>
      {c.status!=='approved'&&<button disabled={busy} onClick={()=>perform('set_status',{code:c.code,status:'approved',reason},c.name+' restored.')}>Restore</button>}
      {c.status!=='suspended'&&<button disabled={busy} onClick={()=>perform('set_status',{code:c.code,status:'suspended',reason},c.name+' suspended.')}>Suspend</button>}
      {c.status!=='disqualified'&&<button disabled={busy} onClick={()=>perform('set_status',{code:c.code,status:'disqualified',reason},c.name+' disqualified.')}>Disqualify</button>}
      {c.status!=='rejected'&&<button disabled={busy} onClick={()=>perform('set_status',{code:c.code,status:'rejected',reason},c.name+' rejected.')}>Reject</button>}
      {c.status!=='withdrawn'&&<button disabled={busy} onClick={()=>perform('set_status',{code:c.code,status:'withdrawn',reason},c.name+' withdrawn from public listing.')}>Withdraw</button>}
    </div></td></tr>)}
   </tbody></table></div>
   {editing&&<div className="staff-edit"><div className="row-buttons"><h4>Edit {editing.code}</h4><button className="outline" onClick={()=>setEditing(null)}>Cancel</button></div>
    <label>Stage name<input value={editName} onChange={e=>setEditName(e.target.value)}/></label>
    <label>City<input value={editCity} onChange={e=>setEditCity(e.target.value)}/></label>
    <label>New demo biography<textarea rows={3} value={editBio} onChange={e=>setEditBio(e.target.value)} maxLength={280}/></label>
    <button type="button" className="btn" disabled={busy} onClick={saveEdit}>Save edited profile</button>
   </div>}
  </div>}
  {view==='votes'&&<div className="panel studio-section"><div className="row-buttons"><div><h3>Mock transactions</h3><p className="muted">Recent fictional voting attempts. Failed transactions do not credit votes.</p></div><button className="outline" type="button" onClick={exportData}>Export demo JSON</button></div>
   <div className="table-scroll"><table><thead><tr><th>Contestant</th><th>Package</th><th>Amount</th><th>Status</th></tr></thead><tbody>
    {txs.map(t=><tr key={t.reference}><td><strong>{t.name}</strong><small>{t.code}</small></td><td>{t.votes} votes</td><td>₦{t.amount.toLocaleString()}</td><td>{t.status}</td></tr>)}
    {!txs.length&&<tr><td colSpan={4}>No sample transactions have been recorded yet.</td></tr>}
   </tbody></table></div>
  </div>}
  {view==='media'&&<AdminMedia token={token}/>}
  {view==='reports'&&<AdminReports token={token}/>}
  {view==='activity'&&<div className="panel studio-section"><h3>Administrative activity</h3><p className="muted">Last 50 staff demonstration changes in the shared audit log.</p>
   <div className="activity-list">{activity.length?activity.map((a,i)=><div key={i}><strong>{a.action}</strong><span>{new Date(a.created_at).toLocaleString('en-NG')}</span></div>):<p>No administrative changes recorded yet.</p>}</div>
  </div>}
  <p className="fine-print">The studio code is for a prototype only. Real production requires individual authenticated administrator accounts, permissions, two-factor authentication, stronger audit controls and payment verification.</p>
 </div>;
}
