'use client';
import {useState} from 'react';
import {getEmailAccessToken} from '@/lib/demo-email-auth';

type Props={code:string;name:string;status:string;onWithdraw:()=>Promise<void>};
const legacyKey='tftc-demo-contestant-access-token';

// Keep the confirmation in the client, but enforce it again in the Edge Function and SQL.
export default function WithdrawAccount({code,name,status,onWithdraw}:Props){
 const [acknowledged,setAcknowledged]=useState(false);
 const [phrase,setPhrase]=useState('');
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const [message,setMessage]=useState('');

 if(status==='withdrawn')return <section className="panel dashboard-panel" aria-labelledby="withdrawn-heading">
  <h3 id="withdrawn-heading">Your profile is archived.</h3>
  <p className="muted">You have withdrawn from TFTC. Your public page, ranking and voting are inactive. Private activity remains available to you and staff for audit. Re-entry requires staff review.</p>
 </section>;
 if(status!=='approved')return null;

 async function withdraw(){
  setError('');setMessage('');
  if(!acknowledged||phrase!=='WITHDRAW'){setError('Read the withdrawal notice and type WITHDRAW to confirm.');return;}
  if(!window.confirm('Withdraw '+name+' ('+code+') from TFTC and archive the public profile? New votes will stop, and only staff can restore participation.'))return;
  setBusy(true);
  try{
   const host=process.env.NEXT_PUBLIC_SUPABASE_URL;
   const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
   if(!host||!key)throw Error('The withdrawal service is unavailable.');
   const jwt=await getEmailAccessToken();
   const legacy=jwt?null:localStorage.getItem(legacyKey);
   if(!jwt&&!legacy)throw Error('Your login session expired. Sign in again.');
   const res=await fetch(host+'/functions/v1/tftc-demo-withdraw',{
    method:'POST',cache:'no-store',
    headers:{'Content-Type':'application/json',apikey:key,...(jwt?{Authorization:'Bearer '+jwt}:{})},
    body:JSON.stringify({confirmation:'WITHDRAW',...(legacy?{access_token:legacy}:{})})
   });
   let result:{archived?:boolean;error?:string}={};
   try{result=await res.json()}catch{}
   if(!res.ok||!result.archived)throw Error(result.error||'The withdrawal request could not be completed.');
   setMessage('Withdrawal confirmed. Your public profile has been archived.');
   await onWithdraw();
  }catch(e){
   setError(e instanceof Error?e.message:'Unable to complete the withdrawal.');
  }finally{setBusy(false);}
 }

 return <section className="panel dashboard-panel" aria-labelledby="withdraw-heading">
  <div className="eyebrow">PARTICIPATION CONTROL</div>
  <h3 id="withdraw-heading">Withdraw and archive my profile</h3>
  <p className="muted">Withdrawal ends your competition participation. Your public profile and approved performance links disappear from public listings, your ranking is removed, and new votes stop. Your account and existing test vote history remain private for audit. You cannot restore yourself. Staff review is required to return.</p>
  <label className="consent">
   <input type="checkbox" checked={acknowledged} onChange={e=>setAcknowledged(e.target.checked)}/>
   I understand that withdrawing archives my profile and requires staff approval to restore.
  </label>
  <label htmlFor="tftc-withdraw-phrase">Type <strong>WITHDRAW</strong> to confirm
   <input id="tftc-withdraw-phrase" type="text" autoComplete="off" spellCheck={false} maxLength={8} value={phrase} placeholder="WITHDRAW" onChange={e=>setPhrase(e.target.value)}/>
  </label>
  <div className="actions"><button type="button" className="outline" disabled={busy||!acknowledged||phrase!=='WITHDRAW'} onClick={()=>void withdraw()}>{busy?'Archiving profile…':'Withdraw from competition'}</button></div>
  {error&&<p className="vote-alert vote-error" role="alert">{error}</p>}
  {message&&<p className="vote-alert vote-success" role="status">{message}</p>}
 </section>;
}
