'use client';

import {useMemo,useState} from 'react';
import Link from 'next/link';
import type {Contestant} from '@/lib/data';
import {contestantUrl,contestantShareText} from '@/lib/share-utils.mjs';import {IllustratedAvatar} from './IllustratedAvatar';

type SortMode='votes'|'name'|'votes-low';

function Initials({name}:{name:string}){
 const pieces=name.trim().split(/\s+/);
 return <span aria-hidden="true">{pieces.slice(0,2).map(part=>part[0]||'').join('').toUpperCase()}</span>;
}

export function ContestantDirectory({contestants}:{contestants:Contestant[]}){
 const [search,setSearch]=useState('');
 const [category,setCategory]=useState('all');
 const [city,setCity]=useState('all');
 const [sort,setSort]=useState<SortMode>('votes');
 const [message,setMessage]=useState('');
 const categories=useMemo(()=>[...new Set(contestants.map(c=>c.category))].sort(),[contestants]);
 const cities=useMemo(()=>[...new Set(contestants.map(c=>c.city))].sort(),[contestants]);
 const results=useMemo(()=>{
  const q=search.trim().toLowerCase();
  const match=contestants.filter(c=>
   (category==='all'||c.category===category)&&
   (city==='all'||c.city===city)&&
   (!q||[c.name,c.code,c.city,c.category].some(v=>v.toLowerCase().includes(q)))
  );
  if(sort==='name')return match.sort((a,b)=>a.name.localeCompare(b.name));
  if(sort==='votes-low')return match.sort((a,b)=>a.votes-b.votes||a.code.localeCompare(b.code));
  return match.sort((a,b)=>b.votes-a.votes||(a.lastVoteAt?Date.parse(a.lastVoteAt):Infinity)-(b.lastVoteAt?Date.parse(b.lastVoteAt):Infinity)||a.code.localeCompare(b.code));
 },[contestants,search,category,city,sort]);
 const anyFilter=!!search.trim()||category!=='all'||city!=='all'||sort!=='votes';
 const reset=()=>{setSearch('');setCategory('all');setCity('all');setSort('votes');setMessage('');};
 async function share(code:string,name:string){
  const url=contestantUrl(code);
  const text=contestantShareText(name,code);
  try{
   if(navigator.share){await navigator.share({title:name+' | TFTC Live Show 2027',text,url});setMessage('Share options opened.');}
   else if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(url);setMessage('Voting profile link copied.');}
   else setMessage('Open this profile to copy its URL: '+url);
  }catch(e){if(e instanceof Error&&e.name==='AbortError')return;setMessage('You can copy the profile link from your address bar.');}
 }
 return <div className="directory-shell">
  <div className="directory-toolbar">
   <label className="directory-search"><span>Search by name or ID</span>
     <input autoComplete="off" value={search} onChange={e=>setSearch(e.target.value)} type="search" placeholder="Search contestants, TFTC ID, city…" />
   </label>
   <label><span>Category</span>
    <select value={category} onChange={e=>setCategory(e.target.value)}>
     <option value="all">All categories</option>
     {categories.map(c=><option key={c} value={c}>{c}</option>)}
    </select>
   </label>
   <label><span>Location</span>
    <select value={city} onChange={e=>setCity(e.target.value)}>
     <option value="all">All cities</option>
     {cities.map(c=><option key={c} value={c}>{c}</option>)}
    </select>
   </label>
   <label><span>Sort by</span>
    <select value={sort} onChange={e=>setSort(e.target.value as SortMode)}>
     <option value="votes">Most votes</option><option value="name">Name A–Z</option><option value="votes-low">Fewest votes</option>
    </select>
   </label>
  </div>
  <div className="directory-results" aria-live="polite">
   <span><b>{results.length}</b> of {contestants.length} eligible contestants</span>
   {anyFilter&&<button type="button" onClick={reset}>Clear filters</button>}
  </div>
  {message&&<p className="directory-message" role="status">{message}</p>}
  {results.length?
   <div className="cards directory-cards">{results.map(c=>
    <article className="card directory-card" key={c.code}>
     <Link className="directory-portrait" href={'/contestant/'+c.code} aria-label={'Open profile of '+c.name}>
      <IllustratedAvatar code={c.code} name={c.name}/>
      <span className="directory-portrait-caption">TFTC LIVE SHOW · 2027</span>
     </Link>
     <div className="card-body">
      <span className="directory-id">{c.code}</span>
      <h3>{c.name}</h3>
      <p>{c.city}, Nigeria</p>
      <p className="directory-category">{c.category}</p>
      <div className="directory-vote-count"><strong>{c.votes.toLocaleString('en-NG')}</strong><small>demo votes</small></div>
      <div className="directory-card-actions">
       <Link className="directory-profile-action" href={'/contestant/'+c.code}>Profile &amp; vote</Link>
       <button type="button" onClick={()=>share(c.code,c.name)} aria-label={'Share voting profile of '+c.name}>Share</button>
      </div>
     </div>
    </article>
   )}</div>
   :<div className="directory-empty"><h3>No contestants found</h3><p>Try another name, contestant ID, category or location.</p><button className="outline" type="button" onClick={reset}>Reset directory filters</button></div>
  }
 </div>;
}

export function ProfileShare({code,name}:{code:string;name:string}){
 const [message,setMessage]=useState('');
 async function copy(){
  const url=contestantUrl(code);
  try{await navigator.clipboard.writeText(url);setMessage('Voting profile link copied.');}
  catch{setMessage('Copy this link: '+url);}
 }
 async function share(){
  const url=contestantUrl(code);
  if(navigator.share){try{await navigator.share({title:name+' | TFTC Live Show',text:contestantShareText(name,code),url});setMessage('Sharing options opened.');}catch(e){if(e instanceof Error&&e.name!=='AbortError')setMessage('Use copy link instead.');}}
  else await copy();
 }
 return <div className="profile-share">
  <button className="outline" onClick={copy} type="button">Copy voting link</button>
  <button className="btn" onClick={share} type="button">Share contestant</button>
  <a className="outline" href={'https://wa.me/?text='+encodeURIComponent(contestantShareText(name,code)+' '+contestantUrl(code))} target="_blank" rel="noopener noreferrer" aria-label={'Share '+name+' on WhatsApp'}>WhatsApp share</a>
  {message&&<p className="muted" role="status">{message}</p>}
 </div>;
}
