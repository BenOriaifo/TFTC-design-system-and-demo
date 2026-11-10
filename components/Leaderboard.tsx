'use client';
import {useMemo,useState} from 'react';
import Link from 'next/link';
import type {Contestant} from '@/lib/data';
import {RankingRefresh} from './DemoVoting';

export default function Leaderboard({contestants,finalists=false}:{contestants:Contestant[];finalists?:boolean}){
 const [search,setSearch]=useState('');
 const [limit,setLimit]=useState<'all'|'10'|'100'>('all');
 const [page,setPage]=useState(1);
 const size=25;
 const participants=finalists?contestants.slice(0,20):contestants;
 const filtered=useMemo(()=>{
  const q=search.trim().toLowerCase();
  const ceiling=finalists?20:limit==='10'?10:limit==='100'?100:participants.length;
  return participants.slice(0,ceiling).map((c,i)=>({...c,rank:i+1}))
    .filter(c=>!q||c.name.toLowerCase().includes(q)||c.code.toLowerCase().includes(q));
 },[participants,search,limit,finalists]);
 const count=Math.max(1,Math.ceil(filtered.length/size));
 const pageNumber=Math.min(page,count);
 return <div className="public-ranking">
  <RankingRefresh/>
  <div className="rank-controls">
   <label>Find a contestant<input type="search" autoComplete="off" placeholder="Search name or TFTC ID" value={search}
      onChange={e=>{setSearch(e.target.value);setPage(1);}}/></label>
   {!finalists&&<div className="rank-switch" role="group" aria-label="Leaderboard ranking limit">
    {[['10','Top 10'],['100','Top 100'],['all','All contestants']].map(([value,text])=>
     <button type="button" key={value} aria-pressed={limit===value} onClick={()=>{setLimit(value as '10'|'100'|'all');setPage(1);}}>{text}</button>)}
   </div>}
  </div>
  <p className="rank-description"><strong>{filtered.length}</strong> of {participants.length} eligible fictional contestants in this view. Rankings are provisional and test votes are not verified payments.</p>
  {filtered.length?<div className="rank-list" aria-label="Fictional contestant rankings">
   {filtered.slice((pageNumber-1)*size,pageNumber*size).map(c=>
    <Link className={'rank-row '+(c.rank<=20?'qualifying':'')} href={'/contestant/'+c.code} key={c.code}>
      <b>#{c.rank}</b><span>{c.name}<small>{c.code} · {c.city}</small></span>
      <strong>{c.votes.toLocaleString('en-NG')} <small>votes</small></strong>
    </Link>)}
  </div>:<div className="directory-empty"><strong>No contestant matches.</strong><p>Try another name or registration ID.</p></div>}
  {count>1&&<div className="rank-pagination"><button className="outline" type="button" disabled={pageNumber===1} onClick={()=>setPage(x=>Math.max(1,x-1))}>Previous</button>
   <span>Page {pageNumber} of {count}</span>
   <button className="outline" type="button" disabled={pageNumber===count} onClick={()=>setPage(x=>Math.min(count,x+1))}>Next</button></div>}
  {finalists&&<p className="fine-print">This is a preview of the Top 20 based on the current fictional vote totals. The official finalists must undergo payment and fraud verification and organizer approval.</p>}
 </div>;
}