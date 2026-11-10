'use client';
import {useCallback,useEffect,useState} from 'react';
type Entry={id:string;code:string;name:string;title:string;url:string;kind:string;status:'pending'|'approved'|'rejected';submitted_at:string};
export default function AdminMedia({token}:{token:string}){
 const [items,setItems]=useState<Entry[]>([]),[filter,setFilter]=useState('pending'),[reason,setReason]=useState('Reviewed fictional performance link'),[busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
 const call=useCallback(async(action:string,payload:Record<string,unknown>={})=>{
  const host=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if(!host||!key)throw Error('Staff media service is not configured.');
  const r=await fetch(host+'/functions/v1/tftc-demo-admin',{method:'POST',headers:{'Content-Type':'application/json',apikey:key},body:JSON.stringify({access_code:token,action,payload}),cache:'no-store'});
  const result=await r.json();if(!r.ok)throw Error(result.error||'Media review could not be completed.');return result.result;
 },[token]);
 const reload=useCallback(async()=>{try{setError('');setItems(await call('media_list'));}catch(e){setError(e instanceof Error?e.message:'Cannot load media submissions.');}},[call]);
 useEffect(()=>{void reload()},[reload]);
 async function review(item:Entry,status:'approved'|'rejected'){
  if(reason.trim().length<3){setError('A review reason is required.');return;}
  if(!window.confirm((status==='approved'?'Approve':'Reject')+' the external link submitted by '+item.name+'?'))return;
  setBusy(true);setError('');setMessage('');
  try{await call('media_review',{id:item.id,status,reason:reason.trim()});setMessage('Submission '+status+'.');await reload();}
  catch(e){setError(e instanceof Error?e.message:'Media review could not be saved.');}finally{setBusy(false);}
 }
 const shown=items.filter(i=>filter==='all'||i.status===filter);
 return <section className="panel studio-section"><div className="row-buttons"><div><div className="eyebrow">EXTERNAL MEDIA MODERATION</div><h3>Performance media queue</h3><p className="muted">Review fictional YouTube and SoundCloud links before they appear publicly. TFTC accepts no video uploads.</p></div><button className="outline" type="button" disabled={busy} onClick={()=>void reload()}>Refresh</button></div>
 <div className="admin-date-filter"><label>Show status<select value={filter} onChange={e=>setFilter(e.target.value)}><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option><option value="all">All</option></select></label><label>Reason for decision<input maxLength={200} value={reason} onChange={e=>setReason(e.target.value)}/></label></div>
 <p className="fine-print">{shown.length} matches · {items.filter(i=>i.status==='pending').length} awaiting review</p>
 {error&&<p className="vote-alert vote-error" role="alert">{error}</p>}{message&&<p className="vote-alert vote-success" role="status">{message}</p>}
 {shown.length?<div className="admin-media-list">{shown.map(i=><article key={i.id}><div><small>{i.code} · {i.name}</small><h4>{i.title}</h4><p className="muted">{i.kind} · {new Date(i.submitted_at).toLocaleDateString('en-NG')}</p><a href={i.url} target="_blank" rel="noopener noreferrer">Inspect external link ↗</a></div><span className={'media-status media-status-'+i.status}>{i.status}</span>
 {i.status==='pending'&&<div className="actions"><button type="button" className="outline" disabled={busy} onClick={()=>void review(i,'rejected')}>Reject</button><button type="button" className="btn" disabled={busy} onClick={()=>void review(i,'approved')}>Approve for public profile</button></div>}</article>)}</div>:<p className="media-empty">No submissions match this status.</p>}
 <p className="fine-print">Production will require licensed content, takedown procedures and staff role permissions.</p></section>;
}
