import 'server-only';
export type Contestant={code:string;name:string;city:string;category:string;votes:number;bio:string;lastVoteAt:string|null};
export const BUNDLES=[{votes:1,price:50},{votes:11,price:500},{votes:25,price:1000},{votes:70,price:2500},{votes:155,price:5000},{votes:325,price:10000}];
const examples=[['TFTC-0014','Minister Amara','Lagos',3420],['TFTC-0021','Daniel Adebayo','Ibadan',2800],['TFTC-0008','Zara Williams','Abuja',2580],['TFTC-0036','Samuel Adeola','Akure',2200],['TFTC-0017','Esther Nwosu','Enugu',1900],['TFTC-0024','Tomi Roberts','Port Harcourt',1680]];
const fallback:Contestant[]=examples.map(v=>({code:String(v[0]),name:String(v[1]),city:String(v[2]),votes:Number(v[3]),category:'Gospel music',bio:'Fictional TFTC contestant for a client concept demonstration.',lastVoteAt:null}));
export async function getContestants():Promise<{rows:Contestant[],connected:boolean}>{
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!url||!key)return {rows:fallback,connected:false};
 try{
  const resp=await fetch(url+'/rest/v1/contestants?select=contestant_code,stage_name,city,category,bio,vote_total,last_vote_at&status=eq.approved&order=vote_total.desc',{headers:{apikey:key},cache:'no-store'});
  if(!resp.ok)throw new Error('Supabase read failed');
  const result=await resp.json() as Array<{contestant_code:string;stage_name:string;city:string;category:string;bio:string;vote_total:number;last_vote_at:string|null}>;
  return {rows:result.map(x=>({code:x.contestant_code,name:x.stage_name,city:x.city,category:x.category,bio:x.bio,votes:x.vote_total,lastVoteAt:x.last_vote_at})),connected:true};
 }catch{return {rows:fallback,connected:false};}
}
export function sorted(rows:Contestant[]){return [...rows].sort((a,b)=>b.votes-a.votes||(a.lastVoteAt?Date.parse(a.lastVoteAt):Infinity)-(b.lastVoteAt?Date.parse(b.lastVoteAt):Infinity)||a.code.localeCompare(b.code));}


export type DemoSettings={phase:'registration'|'voting'|'finale';votingFrozen:boolean;registrationFrozen:boolean;connected:boolean};
export async function getDemoSettings():Promise<DemoSettings>{
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 const fallback:DemoSettings={phase:'registration',votingFrozen:false,registrationFrozen:false,connected:false};
 if(!url||!key)return fallback;
 try{
  const r=await fetch(url+'/rest/v1/competition_settings?select=demo_phase,voting_frozen,registration_frozen&id=eq.1',{headers:{apikey:key},cache:'no-store'});
  if(!r.ok)throw new Error('Settings API error');
  const rows=await r.json() as Array<{demo_phase:DemoSettings['phase'];voting_frozen:boolean;registration_frozen:boolean}>;
  if(!rows.length)throw new Error('Missing settings');
  return {phase:rows[0].demo_phase,votingFrozen:rows[0].voting_frozen,registrationFrozen:rows[0].registration_frozen,connected:true};
 }catch{return fallback;}
}

export type ApprovedMedia={id:string;title:string;url:string;kind:'youtube'|'soundcloud';youtubeId:string|null};
export async function getApprovedMedia(code:string):Promise<ApprovedMedia[]>{
 const host=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!host||!key||!/^TFTC-[0-9]{4}$/.test(code))return [];
 try{
  const response=await fetch(host+'/rest/v1/contestant_media?select=id,title,source_url,source_kind,youtube_id&status=eq.approved&contestant_code=eq.'+encodeURIComponent(code)+'&order=submitted_at.desc',
   {headers:{apikey:key},cache:'no-store'});
  if(!response.ok)return [];
  const records=await response.json() as Array<{id:string;title:string;source_url:string;source_kind:string;youtube_id:string|null}>;
  return records.map(x=>({id:x.id,title:x.title,url:x.source_url,kind:x.source_kind==='soundcloud'?'soundcloud':'youtube',youtubeId:x.youtube_id&&/^[A-Za-z0-9_-]{11}$/.test(x.youtube_id)?x.youtube_id:null}));
 }catch{return [];}
}
