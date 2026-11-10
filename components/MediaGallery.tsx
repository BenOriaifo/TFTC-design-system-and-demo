'use client';
import {useState} from 'react';
import type {ApprovedMedia} from '@/lib/data';
export default function MediaGallery({items,name}:{items:ApprovedMedia[];name:string}){
 const [playing,setPlaying]=useState<string|null>(null);
 return <section id="contestant-performance" className="profile-media-section" aria-labelledby="performance-heading">
  <div className="eyebrow">PERFORMANCE SHOWCASE</div>
  <h2 id="performance-heading">Watch and listen to {name}.</h2>
  <p className="muted">Only approved external links appear here. TFTC does not host video files or audio recordings in this demo.</p>
  {items.length?<div className="media-grid">{items.map(item=><article className="media-tile" key={item.id}>
   <div className="media-tile-art"><span aria-hidden="true">{item.kind==='youtube'?'▶':'♫'}</span><small>{item.kind==='youtube'?'YouTube performance':'SoundCloud recording'}</small></div>
   <h3>{item.title}</h3>
   {item.kind==='youtube'&&item.youtubeId?
    (playing===item.id?<div className="video-frame"><iframe title={item.title} src={'https://www.youtube-nocookie.com/embed/'+item.youtubeId} allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" allowFullScreen loading="lazy" referrerPolicy="strict-origin-when-cross-origin"/></div>:
      <button type="button" className="btn" onClick={()=>setPlaying(item.id)}>Watch performance here</button>)
    :<a className="btn" target="_blank" rel="noopener noreferrer" href={item.url}>Listen on SoundCloud</a>}
   <a className="media-source-link" href={item.url} target="_blank" rel="noopener noreferrer">Open original source ↗</a>
  </article>)}</div>:
  <div className="media-empty"><strong>Performances coming soon.</strong><p>This fictional contestant has not published an approved external performance link yet. You can still explore their story and try a sample vote.</p></div>}
 </section>;
}
