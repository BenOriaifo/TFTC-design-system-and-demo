'use client';
import {useCallback,useEffect,useState} from 'react';import type {FormEvent} from 'react';import {getEmailAccessToken,emailAccountRequest} from '@/lib/demo-email-auth';
type Item={id:string;title:string;url:string;kind:'youtube'|'soundcloud';status:'pending'|'approved'|'rejected';submitted_at:string};
const key='tftc-demo-contestant-access-token';
async function callMedia(action:string,payload:Record<string,unknown>={}){
 const host=process.env.NEXT_PUBLIC_SUPABASE_URL,apiKey=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 const jwt=await getEmailAccessToken();
 if(jwt)return emailAccountRequest(action==='media_list'?'auth_media_list':'auth_media_submit',payload);
 const token=localStorage.getItem(key);
 if(!token||!host||!apiKey)throw Error('Sign in to your fictional contestant account first.');
 const res=await fetch(host+'/functions/v1/tftc-demo-account',{method:'POST',headers:{'Content-Type':'application/json',apikey:apiKey},body:JSON.stringify({action,access_token:token,...payload}),cache:'no-store'});
 const data=await res.json();
 if(!res.ok)throw Error(data.error||'The media demo service is unavailable.');
 return data;
}
export default function DemoMediaManager(){
 const [items,setItems]=useState<Item[]>([]),[title,setTitle]=useState(''),[url,setUrl]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
 const load=useCallback(async()=>{try{const data=await callMedia('media_list');setItems(data.items||[]);}catch(e){setError(e instanceof Error?e.message:'Unable to load media.');}},[]);
 useEffect(()=>{void load()},[load]);
 async function submit(e:FormEvent<HTMLFormElement>){
  e.preventDefault();setBusy(true);setError('');setMessage('');
  try{await callMedia('media_submit',{title:title.trim(),url:url.trim()});setTitle('');setUrl('');setMessage('Link submitted for staff review. It is not public yet.');await load();}
  catch(e){setError(e instanceof Error?e.message:'Unable to submit link.');}
  finally{setBusy(false);}
 }
 return <section className="panel dashboard-panel" aria-labelledby="my-media-heading">
  <div className="eyebrow">EXTERNAL MEDIA · REVIEW FIRST</div><h3 id="my-media-heading">My performance links</h3>
  <p className="muted">Upload your fictional performance to YouTube or SoundCloud first, then submit the public link. TFTC never accepts a video file here. Staff must approve the link before it appears on your public contestant page.</p>
  <form className="media-submit-form" onSubmit={submit}>
   <label>Performance title<input required minLength={3} maxLength={90} value={title} onChange={e=>setTitle(e.target.value)} placeholder="My audition performance (demo)"/></label>
   <label>YouTube or SoundCloud link<input type="url" required value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=..." /></label>
   <button className="btn" type="submit" disabled={busy||!title.trim()||!url.trim()}>{busy?'Submitting…':'Submit link for approval'}</button>
  </form>
  {error&&<p className="vote-alert vote-error" role="alert">{error}</p>}
  {message&&<p className="vote-alert vote-success" role="status">{message}</p>}
  <h4>Submitted media ({items.length})</h4>
  {items.length?<div className="media-submissions">{items.map(item=><div key={item.id}>
   <div><strong>{item.title}</strong><small>{item.kind==='youtube'?'YouTube':'SoundCloud'} · {new Date(item.submitted_at).toLocaleDateString('en-NG')}</small></div>
   <span className={'media-status media-status-'+item.status}>{item.status}</span>
   <a href={item.url} target="_blank" rel="noopener noreferrer">View original link</a>
  </div>)}</div>:<p className="muted">No links submitted. Your public profile will display a friendly empty state until staff approves one.</p>}
  <p className="fine-print">Up to five test links per fictional contestant. Real media usage rights, copyright and moderation policies must be reviewed before production.</p>
 </section>;
}
