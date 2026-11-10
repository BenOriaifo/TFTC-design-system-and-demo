import Link from 'next/link';
import type {Metadata} from 'next';
import {normaliseContestantCode,contestantPreview} from '@/lib/share-utils.mjs';import {notFound} from 'next/navigation';import {getContestants,sorted,getApprovedMedia} from '@/lib/data';import {DemoVoting,RankingRefresh} from '@/components/DemoVoting';import {RegistrationDemo,MyDemoDashboard} from '@/components/DemoAccounts';import EmailPasswordLogin from '@/components/EmailPasswordLogin';import {DemoAdmin} from '@/components/DemoAdmin';import {ContestantDirectory,ProfileShare} from '@/components/ContestantDirectory';import Leaderboard from '@/components/Leaderboard';import InformationPage from '@/components/InformationPage';import MediaGallery from '@/components/MediaGallery';import {IllustratedAvatar} from '@/components/IllustratedAvatar';
export const dynamic='force-dynamic';
export async function generateMetadata({params}:{params:Promise<{slug:string[]}>}):Promise<Metadata>{
 const {slug}=await params;
 if(slug.length===2&&slug[0]==='contestant'){
  const code=normaliseContestantCode(slug[1]);
  if(!code)return {title:'Contestant unavailable | TFTC Live Show',robots:{index:false,follow:false}};
  const {rows,connected}=await getContestants();
  // Avoid advertising an unavailable fictional profile when the shared service is online.
  const contestant=rows.find(x=>x.code===code);
  if(!contestant)return {title:'Contestant unavailable | TFTC Live Show',robots:{index:false,follow:false}};
  const info=contestantPreview(contestant.name,contestant.code,contestant.category,contestant.city);
  return {
   title:info.title,description:info.description,
   alternates:{canonical:info.url},
   openGraph:{title:info.title,description:info.description,siteName:'The Face & The Crown Live Show 2027',type:'website',url:info.url,images:[{url:info.imageUrl,width:1200,height:630,alt:'Fictional TFTC contestant profile: '+contestant.name}]},
   twitter:{card:'summary_large_image',title:info.title,description:info.description,images:[info.imageUrl]},
   robots:{index:false,follow:false}
  };
 }
 return {robots:{index:false,follow:false}};
}
type Props={params:Promise<{slug:string[]}>,searchParams:Promise<{code?:string}>};
export default async function Page({params,searchParams}:Props){const {slug}=await params;const q=await searchParams;const path=slug.join('/');const {rows,connected}=await getContestants();const ranking=sorted(rows);
if(path==='contestants')return <Panel label="PUBLIC CONTESTANT DIRECTORY" title="Every voice has a story." desc={rows.length+' eligible fictional contestants. Search by name, TFTC ID, category or city, then explore their profiles and sample voting links. '+(connected?'Records are shared through Supabase.':'Preview is using fallback sample records.')}><ContestantDirectory contestants={ranking}/></Panel>;
if(path==='leaderboard'||path==='finalists')return <Panel label={path==='finalists'?'TOP 20 QUALIFICATION':'PUBLIC RANKINGS'} title={path==='finalists'?'The Top 20.':'The leaderboard.'} desc="Explore provisional fictional rankings. Successful test votes update the shared ledger and rankings, but these are not verified payments or official finalists."><Leaderboard contestants={ranking} finalists={path==='finalists'}/></Panel>;
if(path.startsWith('contestant/')&&slug.length===2){
 const c=ranking.find(c=>c.code.toUpperCase()===slug[1].toUpperCase());
 if(!c)return notFound();
 const position=ranking.findIndex(x=>x.code===c.code)+1;const media=await getApprovedMedia(c.code);
 return <Panel label={c.code+' / PUBLIC PROFILE'} title={c.name} desc="Explore the contestant profile, share a voting link and try a simulated supporter vote. All information and payments are fictional.">
 <Link href="/contestants" className="text-link">← Back to all contestants</Link><nav className="profile-jump-links" aria-label="Explore this contestant"><a href="#contestant-performance">Watch or listen</a><a href="#vote-panel">Support with a demo vote</a></nav>
 <div className="profile-showcase">
  <section className="panel profile-identity" aria-label="Contestant details">
   <div className="profile-stage">
    <IllustratedAvatar code={c.code} name={c.name}/>
    <span className="profile-stage-label">TFTC LIVE SHOW · 2027</span>
   </div>
   <div className="profile-identity-top"><span className="profile-code">{c.code}</span><span className="profile-eligible">Eligible · Demo</span></div>
   <h2>{c.name}</h2><p className="profile-subline">{c.category} · {c.city}, Nigeria</p>
   <p className="profile-description">{c.bio||'This contestant has not added a sample biography yet.'}</p>
   <div className="profile-stat-pair">
    <div><small>Credited demo votes</small><strong>{c.votes.toLocaleString('en-NG')}</strong></div>
    <div><small>Current rank</small><strong>#{position}</strong></div>
   </div>
   <ProfileShare code={c.code} name={c.name}/>
  </section>
  <div id="vote-panel"><DemoVoting code={c.code} name={c.name} initialVotes={c.votes}/></div>
 </div>
 <MediaGallery items={media} name={c.name}/>
 </Panel>;
}
if(path==='register')return <Panel label="CONTESTANT ENTRY" title="Your journey starts here." desc="Explore a realistic fictional registration. The ₦2,000 checkout is simulated, but successful demo entries are saved in the shared database."><RegistrationDemo/></Panel>;
if(path==='login')return <Panel label="CONTESTANT ACCESS" title="Contestant login." desc="Use your fictional email address and password to sign in. Previous testers can link an existing demo access code to an email account."><EmailPasswordLogin/><h2 style={{marginTop:45}}>Explore the sample contestants</h2><p className="muted">These examples display public information only, without claiming actual authentication.</p><div className="rank-list">{ranking.slice(0,6).map(c=><Link className="rank-row" href={'/dashboard?code='+c.code} key={c.code}><b>•</b><span>{c.name}<small>{c.code}</small></span><strong>Preview dashboard →</strong></Link>)}</div></Panel>;
if(path==='dashboard'){
 const sample=q.code?ranking.find(c=>c.code===q.code):null;
 if(sample)return <Panel label="EXAMPLE CONTESTANT PREVIEW · NOT LOGGED IN" title={'Welcome, '+sample.name+'.'} desc="This is a public sample identity view with no private information. Registered demo contestants can open their own access-code dashboard."><div className="stats"><div><small>Votes</small><strong>{sample.votes.toLocaleString()}</strong></div><div><small>Rank</small><strong>#{ranking.findIndex(x=>x.code===sample.code)+1}</strong></div><div><small>Contestant ID</small><strong>{sample.code}</strong></div><div><small>Qualification</small><strong>{ranking.findIndex(x=>x.code===sample.code)<20?'Top 20':'Below cutoff'}</strong></div></div><div className="actions"><Link className="outline" href="/dashboard">My registered demo account</Link><Link className="outline" href="/login">Switch fictional contestant</Link></div></Panel>;
 return <Panel label="MY DEMO ACCOUNT" title="My contestant dashboard." desc="Your authenticated email account loads the fictional contestant details, credited votes and ranking. Earlier demo codes remain available during transition."><MyDemoDashboard/></Panel>;
}
if(path==='admin/login'||path==='admin')return <main className="wrap section admin-entry"><DemoAdmin/></main>;
if(['about','rules','agreement','privacy','contact'].includes(path))return <InformationPage section={path as 'about'|'rules'|'agreement'|'privacy'|'contact'}/>;
return notFound();
}
function Panel({label,title,desc,children}:{label:string;title:string;desc:string;children?:React.ReactNode}){return <main className="wrap section"><div className="eyebrow">{label}</div><h1>{title}</h1><p className="intro">{desc}</p>{children}</main>}
