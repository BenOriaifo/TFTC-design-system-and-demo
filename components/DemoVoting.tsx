'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {contestantUrl,contestantShareText} from '@/lib/share-utils.mjs';

const bundles = [
  {votes:1,price:50},{votes:11,price:500},{votes:25,price:1000},
  {votes:70,price:2500},{votes:155,price:5000},{votes:325,price:10000}
] as const;
type Receipt={reference:string;status:'simulated_success'|'simulated_failure';votes:number;amount_naira:number;total:number;replayed:boolean;note:string};

export function DemoVoting({code,name,initialVotes}:{code:string;name:string;initialVotes:number}){
  const router=useRouter();
  const [selected,setSelected]=useState<number>(11);
  const [total,setTotal]=useState(initialVotes);
  const [busy,setBusy]=useState(false);
  const [receipt,setReceipt]=useState<Receipt|null>(null);
  const [error,setError]=useState('');
  const [supporter,setSupporter]=useState({name:'Demo Supporter',email:'supporter@example.test',phone:'08000000000'});
  const bundle=bundles.find(x=>x.votes===selected)!;
  const host=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  useEffect(()=>{setTotal(initialVotes)},[initialVotes]);
  async function submit(success:boolean){
    setError('');setReceipt(null);
    if(!supporter.name.trim()||!/^\S+@\S+\.\S+$/.test(supporter.email)||!supporter.phone.trim()){setError('Complete the fictional supporter details before continuing.');return;}
    if(!host||!key){setError('The shared demo voting service is not yet configured.');return;}
    if(!globalThis.crypto?.randomUUID){setError('A modern browser is needed for this test.');return;}
    setBusy(true);
    try{
      const response=await fetch(host+'/functions/v1/tftc-demo-vote',{
        method:'POST',
        headers:{'Content-Type':'application/json',apikey:key},
        body:JSON.stringify({
          contestant_code:code,
          votes:selected,
          simulate_success:success,
          reference:crypto.randomUUID()
        }),
        cache:'no-store'
      });
      const result=await response.json();
      if(!response.ok)throw new Error(typeof result.error==='string'?result.error:'Demo voting temporarily unavailable.');
      setReceipt(result as Receipt);
      setTotal(Number(result.total)||0);
      if(result.status==='simulated_success')router.refresh();
    }catch(e){
      setError(e instanceof Error?e.message:'Unable to record a test transaction.');
    }finally{setBusy(false);}
  }
  return <div className="panel mock-voting">
    <span className="eyebrow">DEMO VOTING · NO REAL PAYMENTS</span>
    <h2>Support {name}.</h2>
    <p className="muted">Select an official voting bundle. A simulated success credits the shared demo ledger in Supabase; a simulated failure credits nothing.</p>
    <div className="vote-current"><span>Current demonstration votes</span><strong>{total.toLocaleString('en-NG')}</strong></div>
    <div className="demo-vote-steps"><span>1 · Choose votes</span><span>2 · Enter sample supporter details</span><span>3 · Simulate checkout</span></div><div className="packages selection" role="group" aria-label="Voting packages">
      {bundles.map(b=><button type="button" key={b.votes} disabled={busy}
        aria-pressed={selected===b.votes}
        className={selected===b.votes?'bundle selected':'bundle'}
        onClick={()=>{setSelected(b.votes);setReceipt(null);setError('');}}>
        <span>{b.votes} {b.votes===1?'vote':'votes'}</span>
        <strong>₦{b.price.toLocaleString('en-NG')}</strong>
      </button>)}
    </div>
    <div className="mock-supporter-fields"><p className="muted">Fictional supporter details, kept in this browser only. They are never sent to the server or used for real receipts.</p><div><label>Supporter name<input maxLength={60} value={supporter.name} onChange={e=>setSupporter(s=>({...s,name:e.target.value}))}/></label><label>Receipt email (fictional)<input type="email" maxLength={100} value={supporter.email} onChange={e=>setSupporter(s=>({...s,email:e.target.value}))}/></label><label>Phone (fictional)<input type="tel" maxLength={30} value={supporter.phone} onChange={e=>setSupporter(s=>({...s,phone:e.target.value}))}/></label></div></div>
    <div className="vote-summary"><span>Selected demo package</span><strong>{bundle.votes} votes · ₦{bundle.price.toLocaleString('en-NG')}</strong></div>
    <div className="vote-actions">
      <button className="btn" type="button" disabled={busy} onClick={()=>submit(true)}>
        {busy?'Recording test…':'Simulate successful vote'}
      </button>
      <button className="outline" type="button" disabled={busy} onClick={()=>submit(false)}>
        Simulate failed payment
      </button>
    </div>
    {error&&<p className="vote-alert vote-error" role="alert">{error}</p>}
    {receipt&&<div className={receipt.status==='simulated_success'?'vote-alert vote-success':'vote-alert vote-failure'} role="status">
      <strong>{receipt.status==='simulated_success'?'Demo votes credited successfully':'Simulated payment failed. No votes credited.'}</strong>
      <p>Reference: <code>{receipt.reference}</code></p>
      <p>Package: {receipt.votes} votes · ₦{receipt.amount_naira.toLocaleString('en-NG')}</p>
      <p>Current shared total: <b>{receipt.total.toLocaleString('en-NG')} votes</b></p>
      <div className="vote-receipt-actions"><Link href="/leaderboard" className="text-link">Check the public leaderboard →</Link><a href={'https://wa.me/?text='+encodeURIComponent(contestantShareText(name,code)+' '+contestantUrl(code))} target="_blank" rel="noopener noreferrer">Share this contestant on WhatsApp ↗</a></div>
    </div>}
    <p className="fine-print">Fictional competition data only. No real card charge, payment, identity verification, or prize qualification occurs. This feature is not a production payment or anti-fraud system.</p>
  </div>;
}

export function RankingRefresh(){
  const router=useRouter();
  const [last,setLast]=useState<Date|null>(null);
  useEffect(()=>{
    const timer=window.setInterval(()=>{
      if(document.visibilityState==='visible'){router.refresh();setLast(new Date());}
    },10000);
    return ()=>clearInterval(timer);
  },[router]);
  return <div className="refresh-indicator">
    <span>Illustrative rankings refresh while this tab is active, about every 10 seconds.</span>
    <button className="outline" type="button" onClick={()=>{router.refresh();setLast(new Date());}}>Refresh now</button>
    {last&&<small>Last checked: {last.toLocaleTimeString('en-NG')}</small>}
  </div>;
}
