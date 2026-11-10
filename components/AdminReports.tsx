'use client';
import {useCallback,useEffect,useMemo,useState} from 'react';
import {createCsv,inspectCsvDocument} from '@/lib/csv-utils.mjs';

type Bundle={votes:number;price:number;successful:number;failed:number;total_votes_credited:number;mock_gross:number};
type Report={registration_success:number;registration_failed:number;registration_gross:number;voting_gross:number;voting_success:number;voting_failed:number;votes_sold:number;baseline_votes:number;bundles:Bundle[]};
type Registration={reference:string;code:string|null;name:string|null;status:string;amount:number;created_at:string};
type Consent={reference:string;code:string;name:string;version:string;accepted_at:string;source:string};
type Finalist={rank:number;code:string;name:string;votes:number;last_vote_at:string|null};
type Tab='revenue'|'registrations'|'consents'|'finalists'|'communications';
const money=(x:number)=>'₦'+Number(x||0).toLocaleString('en-NG');
const time=(s:string)=>new Date(s).toLocaleString('en-NG',{dateStyle:'medium',timeStyle:'short',timeZone:'Africa/Lagos'});
async function read<T>(token:string,action:string):Promise<T>{
 const host=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!host||!key)throw new Error('The demo reporting service is not configured.');
 const r=await fetch(host+'/functions/v1/tftc-demo-admin',{method:'POST',headers:{'Content-Type':'application/json',apikey:key},body:JSON.stringify({access_code:token,action}),cache:'no-store'});
 const data=await r.json();
 if(!r.ok)throw new Error(data.error||'Reports request failed.');
 return data.result as T;
}
async function validatedDownload(name:string,body:string){
 const blob=new Blob([body],{type:'text/csv;charset=utf-8'});
 // Inspect the actual generated browser Blob before initiating a download.
 const bytes=new Uint8Array(await blob.arrayBuffer());
 if(bytes.length<3||bytes[0]!==0xEF||bytes[1]!==0xBB||bytes[2]!==0xBF)throw new Error('CSV UTF-8 signature is missing');
 // Blob.text() intentionally strips a UTF-8 BOM, so compare decoded content without it.
 if((await blob.text())!==body.slice(1))throw new Error('Downloaded CSV bytes could not be validated');
 const url=URL.createObjectURL(blob);
 try{const a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();}
 finally{window.setTimeout(()=>URL.revokeObjectURL(url),10000);}
 return blob.size;
}
function Copy({value}:{value:string}){
 const [done,setDone]=useState(false);
 return <button className="outline" type="button" onClick={async()=>{try{await navigator.clipboard.writeText(value);setDone(true);}catch{setDone(false);}}}>{done?'Copied':'Copy preview'}</button>;
}
export default function AdminReports({token}:{token:string}){
 const [tab,setTab]=useState<Tab>('revenue');
 const [report,setReport]=useState<Report|null>(null);
 const [registrations,setRegistrations]=useState<Registration[]>([]);
 const [consents,setConsents]=useState<Consent[]>([]);
 const [finalists,setFinalists]=useState<Finalist[]>([]);
 const [busy,setBusy]=useState(true),[error,setError]=useState('');
 const [chosen,setChosen]=useState(''),[start,setStart]=useState(''),[end,setEnd]=useState('');
 const [exportPreview,setExportPreview]=useState<{name:string;rows:number;bytes:number;sample:string}|null>(null);
 const [exportError,setExportError]=useState('');
 const exportCsv=async(name:string,source:readonly object[],columns:string[])=>{
  setExportError('');
  try{
   const body=createCsv(source as Record<string,unknown>[],columns);
   const detail=inspectCsvDocument(body,columns,source.length);
   const bytes=await validatedDownload(name,body);
   setExportPreview({name,rows:detail.rowCount,bytes,sample:body.replace(/^\uFEFF/,'').slice(0,1150)});
  }catch(e){setExportError(e instanceof Error?e.message:'Unable to validate this CSV export.');}
 };
 const reload=useCallback(async()=>{
  setBusy(true);setError('');
  try{
   const [summary,regs,agreements,top]=await Promise.all([
    read<Report>(token,'reports'),read<Registration[]>(token,'registrations'),
    read<Consent[]>(token,'consents'),read<Finalist[]>(token,'top20')
   ]);
   setReport(summary);setRegistrations(regs);setConsents(agreements);setFinalists(top);
   setChosen(old=>old||regs.find(r=>r.status==='simulated_success'&&r.code)?.reference||'');
  }catch(e){setError(e instanceof Error?e.message:'Could not load demo reports.');}
  finally{setBusy(false);}
 },[token]);
 useEffect(()=>{void reload()},[reload]);
 const shown=useMemo(()=>registrations.filter(r=>{
  const day=new Date(r.created_at).toISOString().slice(0,10);
  return (!start||day>=start)&&(!end||day<=end);
 }),[registrations,start,end]);
 const selected=registrations.find(r=>r.reference===chosen&&r.code)||registrations.find(r=>r.status==='simulated_success'&&r.code);
 const profile='https://tftc-platform-dev.vercel.app/contestant/'+(selected?.code||'TFTC-XXXX');
 const email=[
  'Subject: Welcome to TFTC Live Show! Your Contestant ID is '+(selected?.code||'TFTC-XXXX'),
  '','Hi '+(selected?.name||'Contestant')+',','',
  'Your fictional registration is confirmed for TFTC LIVE SHOW 2027.',
  'Contestant ID: '+(selected?.code||'TFTC-XXXX'),
  'Registration status: Approved (demo)',
  'Public voting profile: '+profile,'',
  'Voting: 3 February to 2 March 2027 (WAT)',
  'Grand finale: 14 March 2027','',
  'This is a template preview. No email has been sent.','Team TFTC Live Show'
 ].join('\n');
 const sms='TFTC 2027 DEMO: '+(selected?.name||'Contestant')+', your sample registration ID is '+(selected?.code||'TFTC-XXXX')+'. Profile: '+profile+'. This is an unsent SMS preview.';
 const tabs=[['revenue','Revenue'],['registrations','Registrations'],['consents','Consent'],['finalists','Top 20'],['communications','Email & SMS']] as const;
 return <section className="panel studio-section admin-reports">
 <div className="row-buttons"><div><div className="eyebrow">STAFF REPORTS · FICTIONAL DATA</div><h3>Reports, exports and communications</h3><p className="muted">No real charges, refunds or messages. All financial amounts are simulated.</p></div>
  <button className="outline" type="button" disabled={busy} onClick={()=>void reload()}>Refresh reports</button></div>
 <div className="admin-report-tabs" role="group" aria-label="Report sections">
  {tabs.map(([v,label])=><button type="button" key={v} aria-pressed={tab===v} className={tab===v?'active':''} onClick={()=>{setTab(v);setExportPreview(null);setExportError('');}}>{label}</button>)}
 </div>
 {busy&&<p role="status">Loading fictional data…</p>}
 {error&&<p className="vote-alert vote-error" role="alert">{error}</p>}
 {!busy&&!error&&<>
  {tab==='revenue'&&report&&<>
   <div className="admin-report-grid">
    <div><small>Mock registration gross</small><strong>{money(report.registration_gross)}</strong><span>{report.registration_success} successful, {report.registration_failed} failed</span></div>
    <div><small>Mock voting gross</small><strong>{money(report.voting_gross)}</strong><span>{report.voting_success} successful, {report.voting_failed} failed</span></div>
    <div><small>Votes sold in test transactions</small><strong>{report.votes_sold.toLocaleString()}</strong><span>Excludes seeded baseline</span></div>
    <div><small>Pre-seeded example votes</small><strong>{report.baseline_votes.toLocaleString()}</strong><span>Illustrative, not revenue</span></div>
   </div>
   <p className="fine-print">Refunds, payment fees and net collections are intentionally unavailable because there is no real payment processing or reconciliation.</p>
   <div className="table-scroll"><table><thead><tr><th>Bundle</th><th>Successful</th><th>Failed</th><th>Mock votes credited</th><th>Simulated gross</th></tr></thead><tbody>
    {report.bundles.map(b=><tr key={b.votes}><td>{b.votes} votes at {money(b.price)}</td><td>{b.successful}</td><td>{b.failed}</td><td>{b.total_votes_credited.toLocaleString()}</td><td>{money(b.mock_gross)}</td></tr>)}
   </tbody></table></div>
   <button className="outline report-export" type="button" onClick={()=>exportCsv('tftc-vote-packages.csv',report.bundles,['votes','price','successful','failed','total_votes_credited','mock_gross'])}>Export package CSV</button>
  </>}
  {tab==='registrations'&&<>
   <div className="admin-date-filter"><label>From<input type="date" value={start} onChange={e=>setStart(e.target.value)}/></label><label>To<input type="date" value={end} onChange={e=>setEnd(e.target.value)}/></label><button className="outline" type="button" onClick={()=>{setStart('');setEnd('');}}>Clear dates</button></div>
   <p className="fine-print">{shown.length} of {registrations.length} recent mock checkout attempts, up to 200. Filter uses UTC date for consistency; displayed times use WAT.</p>
   <div className="table-scroll"><table><thead><tr><th>Date (WAT)</th><th>Contestant ID</th><th>Name</th><th>Status</th><th>Mock amount</th></tr></thead><tbody>
    {shown.map(r=><tr key={r.reference}><td>{time(r.created_at)}</td><td>{r.code||'Not issued'}</td><td>{r.name||'N/A'}</td><td>{r.status==='simulated_success'?'Successful':'Failed'}</td><td>{money(r.amount)}</td></tr>)}
   </tbody></table></div>
   <button className="outline report-export" type="button" onClick={()=>exportCsv('tftc-registrations.csv',shown,['reference','code','name','status','amount','created_at'])}>Export registrations CSV</button>
  </>}
  {tab==='consents'&&<>
   <p className="muted">The fictional registration agreement version and timestamp are displayed here. Backfilled historical records are explicitly labeled and are not original consent evidence.</p>
   <div className="table-scroll"><table><thead><tr><th>Contestant</th><th>Version</th><th>Time (WAT)</th><th>Capture source</th></tr></thead><tbody>
    {consents.map(c=><tr key={c.reference}><td>{c.name}<small>{c.code}</small></td><td>{c.version}</td><td>{time(c.accepted_at)}</td><td>{c.source==='historical_demo_backfill'?'Historical backfill':'Simulated checkbox'}</td></tr>)}
   </tbody></table></div>
   <button className="outline report-export" type="button" onClick={()=>exportCsv('tftc-consents.csv',consents,['reference','code','name','version','accepted_at','source'])}>Export consent CSV</button>
  </>}
  {tab==='finalists'&&<>
   <p className="muted">Provisional Top 20 of eligible demo contestants. The production result would require payment verification and the organizer's announcement.</p>
   <div className="table-scroll"><table><thead><tr><th>Rank</th><th>Contestant ID</th><th>Name</th><th>Votes</th></tr></thead><tbody>
    {finalists.map(c=><tr key={c.code}><td>#{c.rank}</td><td>{c.code}</td><td>{c.name}</td><td>{c.votes.toLocaleString()}</td></tr>)}
   </tbody></table></div>
   <button className="outline report-export" type="button" onClick={()=>exportCsv('tftc-provisional-top20.csv',finalists,['rank','code','name','votes','last_vote_at'])}>Export Top 20 CSV</button>
  </>}
  {tab==='communications'&&<>
   <p className="muted">Preview a registration confirmation email and SMS, using fictional details. Nothing is sent or delivered.</p>
   <label className="admin-preview-label">Select demo registration
    <select value={chosen} onChange={e=>setChosen(e.target.value)}>
     {registrations.filter(r=>r.status==='simulated_success'&&r.code).map(r=><option key={r.reference} value={r.reference}>{r.name} · {r.code}</option>)}
    </select></label>
   <div className="admin-preview-grid">
    <div><h4>Unsent email preview</h4><pre>{email}</pre><Copy value={email}/></div>
    <div><h4>Unsent SMS preview</h4><pre>{sms}</pre><Copy value={sms}/></div>
   </div>
   <p className="fine-print">Delivery status: Not sent. Actual communication, retry and provider status require a production integration.</p>
  </>}
 </>}
 {exportError&&<p role="alert" className="vote-alert vote-error">{exportError}</p>}
 {exportPreview&&<details className="csv-preview" open><summary>Validated CSV: {exportPreview.name} · {exportPreview.rows} data rows · {exportPreview.bytes} bytes</summary><p className="fine-print">The generated Blob was read back, with headers, column counts and records checked before the download started. Inspect the saved file separately during acceptance.</p><pre>{exportPreview.sample}</pre></details>}
 </section>;
}