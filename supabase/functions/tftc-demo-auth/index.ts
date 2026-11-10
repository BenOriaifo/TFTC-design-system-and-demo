// TFTC fictional contestant access. Not a production authentication or payments service.
const allowedOrigins = [
 /^https:\/\/tftc-platform-dev\.vercel\.app$/,
 /^https:\/\/tftc-platform-[a-z0-9-]+\.vercel\.app$/,
 /^https:\/\/tftc-platform-[a-z0-9-]+-koriai\.vercel\.app$/,
 /^http:\/\/localhost:3000$/
];
const allowed=(origin:string|null)=>!origin||allowedOrigins.some(x=>x.test(origin));
const cors=(origin:string|null)=>({
 "Content-Type":"application/json","Cache-Control":"no-store",
 "Access-Control-Allow-Origin":origin&&allowed(origin)?origin:"https://tftc-platform-dev.vercel.app",
 "Access-Control-Allow-Headers":"apikey,content-type,authorization","Access-Control-Allow-Methods":"POST,OPTIONS","Vary":"Origin"
});
const send=(data:unknown,status:number,origin:string|null)=>new Response(JSON.stringify(data),{status,headers:cors(origin)});
const isUuid=(x:unknown)=>typeof x==="string"&&/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(x);
const sha=async(value:string)=>Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value)))).map(x=>x.toString(16).padStart(2,"0")).join("");
Deno.serve(async(req:Request)=>{
 const origin=req.headers.get("origin");
 if(!allowed(origin))return send({error:"Origin not permitted."},403,null);
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers:cors(origin)});
 if(req.method!=="POST")return send({error:"POST only."},405,origin);
 let publishable="";
 try{publishable=JSON.parse(Deno.env.get("SUPABASE_PUBLISHABLE_KEYS")||"{}").default||"";}catch{}
 if(!publishable||req.headers.get("apikey")!==publishable)return send({error:"Demo API key invalid."},401,origin);
 const url=Deno.env.get("SUPABASE_URL"),secret=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
 if(!url||!secret)return send({error:"Demo account service unavailable."},503,origin);
 let input:Record<string,unknown>;
 try{
  if(Number(req.headers.get("content-length")||0)>4096)return send({error:"Request too large."},413,origin);
  input=await req.json();
 }catch{return send({error:"Invalid JSON."},400,origin);}
 if(!["register","login","update_profile","media_submit","media_list","register_password","claim_legacy_password","auth_account","auth_update_profile","auth_media_list","auth_media_submit"].includes(String(input.action)))return send({error:"Unknown demo account action."},400,origin);

 // The demo accepts reserved-example emails only and sends no mail. Passwords
 // are sent to Supabase Auth once, never retained in a custom Postgres table.
 const validEmail=(value:string)=>value.length<255&&/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(value)&&/@example\.(test|com|net|org)$/i.test(value);
 const validPassword=(value:string)=>value.length>=12&&value.length<=72&&/[A-Za-z]/.test(value)&&/[0-9]/.test(value);
 const serviceRpc=async(action:string,payload:Record<string,unknown>)=>{
  const r=await fetch(url+"/rest/v1/rpc/"+action,{method:"POST",headers:{"Content-Type":"application/json",apikey:secret,Authorization:"Bearer "+secret},body:JSON.stringify(payload),signal:AbortSignal.timeout(15000)});
  if(!r.ok)throw Error((await r.text()).slice(0,700));
  return await r.json();
 };
 const rest=async(path:string,method="GET",body?:Record<string,unknown>)=>{
  const r=await fetch(url+"/rest/v1/"+path,{method,headers:{"Content-Type":"application/json",apikey:secret,Authorization:"Bearer "+secret,Prefer:"return=representation"},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(15000)});
  if(!r.ok)throw Error("Data operation failed ("+r.status+"): "+(await r.text()).slice(0,300));
  return await r.json();
 };
 const linkedContestant=async(ownerId:string)=>{
  const rows=await rest("contestants?select=id,contestant_code,stage_name,city,state,category,bio,status,vote_total,created_at&owner_user_id=eq."+encodeURIComponent(ownerId)+"&limit=1");
  if(!rows.length)throw Error("No TFTC contestant is linked to this email account");
  return rows[0];
 };
 const supportedMedia=(source:string)=>{
  let u:URL;try{u=new URL(source);}catch{throw Error("Invalid external media URL");}
  if(u.protocol!=="https:"||u.username||u.password||u.port||u.hash)throw Error("Use a standard YouTube or SoundCloud link");
  let kind="";let youtubeId:string|null=null;
  if(["youtube.com","www.youtube.com"].includes(u.hostname)){
   const id=u.pathname==="/watch"?u.searchParams.get("v"):u.pathname.startsWith("/shorts/")?u.pathname.split("/")[2]:null;
   if(!id||!/^[A-Za-z0-9_-]{11}$/.test(id))throw Error("Invalid YouTube video link");
   kind="youtube";youtubeId=id;
  }else if(u.hostname==="youtu.be"&&/^\/[A-Za-z0-9_-]{11}$/.test(u.pathname)){
   kind="youtube";youtubeId=u.pathname.slice(1);
  }else if(["soundcloud.com","www.soundcloud.com"].includes(u.hostname)&&/^\/[A-Za-z0-9_-]+\/[A-Za-z0-9_-]+\/?$/.test(u.pathname)){kind="soundcloud";}
  else throw Error("Use a standard YouTube or SoundCloud link");
  return {kind,youtubeId};
 };

 const manageAuth=async(method:string,path:string,data?:Record<string,unknown>)=>{
  const r=await fetch(url+"/auth/v1/admin/"+path,{method,headers:{"Content-Type":"application/json",apikey:secret,Authorization:"Bearer "+secret},...(data?{body:JSON.stringify(data)}:{}),signal:AbortSignal.timeout(15000)});
  if(!r.ok)throw Error("Auth provider: "+r.status+" "+(await r.text()).slice(0,180));
  return method==="DELETE"?null:await r.json();
 };
 if(input.action==="register_password"||input.action==="claim_legacy_password"){
  const email=typeof input.email==="string"?input.email.trim().toLowerCase():"";
  const password=typeof input.password==="string"?input.password:"";
  if(!validEmail(email)||!validPassword(password))return send({error:"Use a fictional address such as singer@example.test and a 12-72 character password containing letters and numbers."},400,origin);
  if(!isUuid(input.access_token))return send({error:"Invalid private demonstration registration code."},400,origin);
  const registering=input.action==="register_password";
  if(registering&&(!isUuid(input.reference)||typeof input.stage_name!=="string"||input.stage_name.length>64||
    typeof input.city!=="string"||input.city.length>60||typeof input.state!=="string"||input.state.length>60||
    typeof input.category!=="string"||input.category.length>60||typeof input.bio!=="string"||input.bio.length>280||
    input.age_confirmed!==true||input.consent_agreed!==true||input.simulate_success!==true))
   return send({error:"Complete the fictional contestant registration fields and agreement."},400,origin);
  const ip=(req.headers.get("cf-connecting-ip")||req.headers.get("x-real-ip")||(req.headers.get("x-forwarded-for")||"").split(",")[0]||"unidentified").trim().slice(0,64);
  const fingerprint=await sha(secret.slice(0,32)+":"+ip);
  let userId="";
  try{
   if(registering){
    const available=await serviceRpc("tftc_demo_registration_room",{p_fingerprint:fingerprint});
    if(!available)return send({error:"This test browser is registration-limited or the demo is paused."},429,origin);
   }else{
    await serviceRpc("get_demo_contestant_account",{p_access_token:input.access_token});
   }
   const created=await manageAuth("POST","users",{email,password,email_confirm:true,app_metadata:{tftc_demo:true}});
   userId=String(created?.id||"");
   if(!isUuid(userId))throw Error("Invalid user id returned by Auth");
   let receipt:unknown;
   if(registering){
    receipt=await serviceRpc("register_demo_contestant",{p_reference:input.reference,p_access_token:input.access_token,
     p_name:input.stage_name,p_city:input.city,p_state:input.state,p_category:input.category,p_bio:input.bio,
     p_fingerprint_hash:fingerprint,p_success:true});
   }
   // Original access token proves ownership. The FK confirms the new Auth user exists.
   // The conditional PATCH prevents claiming an account already linked elsewhere.
   const proof=await serviceRpc("get_demo_contestant_account",{p_access_token:input.access_token});
   const claimed=await rest("contestants?contestant_code=eq."+encodeURIComponent(proof.code)+"&owner_user_id=is.null&select=contestant_code","PATCH",{owner_user_id:userId});
   if(claimed.length!==1)throw Error("Contestant already linked to another account");
   return send({...((receipt&&typeof receipt==="object")?receipt:{}),linked:true,code:proof.code,simulated:true,email_login:true},200,origin);
  }catch(e){
   if(userId){try{await manageAuth("DELETE","users/"+userId)}catch{}}
   const msg=String(e);
   const known=["Invalid sample registration details","Demo registration limit reached","Demo contestant registration is full","Demo registration is paused",
    "Invalid or expired demo access code","Contestant already linked to another account","Auth user already owns a contestant"];
   const reason=known.find(x=>msg.includes(x))||(msg.includes("422")||msg.includes("already")?"That fictional email is not available. Choose a different address.":"The fictional email account could not be created.");
   return send({error:reason},reason.includes("limit")?429:400,origin);
  }
 }
 if(["auth_account","auth_update_profile","auth_media_list","auth_media_submit"].includes(String(input.action))){
  const authorization=req.headers.get("Authorization")||"";
  const access=authorization.startsWith("Bearer ")?authorization.slice(7):"";
  if(access.length<30||access.length>4096)return send({error:"Sign in with your email and password."},401,origin);
  let ownerId="";
  try{
   const verified=await fetch(url+"/auth/v1/user",{headers:{apikey:publishable,Authorization:"Bearer "+access},signal:AbortSignal.timeout(12000)});
   if(!verified.ok)return send({error:"Session expired. Sign in again."},401,origin);
   const user=await verified.json();
   if(!isUuid(user.id)||user.is_anonymous===true)return send({error:"An authenticated contestant is required."},401,origin);
   ownerId=user.id;
  }catch{return send({error:"Unable to verify the account session."},503,origin);}
  const action=String(input.action).slice(5);
  const data:Record<string,unknown>={};
  if(action==="update_profile"){
   if(typeof input.stage_name!=="string"||input.stage_name.length>64||typeof input.city!=="string"||input.city.length>60||
    typeof input.state!=="string"||input.state.length>60||typeof input.category!=="string"||input.category.length>60||
    typeof input.bio!=="string"||input.bio.length>280)return send({error:"Complete the fictional profile details."},400,origin);
   Object.assign(data,{stage_name:input.stage_name,city:input.city,state:input.state,category:input.category,bio:input.bio});
  }else if(action==="media_submit"){
   if(typeof input.title!=="string"||input.title.length>90||typeof input.url!=="string"||input.url.length>300)
    return send({error:"Provide a valid title and YouTube or SoundCloud URL."},400,origin);
   Object.assign(data,{title:input.title,url:input.url});
  }
  try{
   const account=await linkedContestant(ownerId);
   if(action==="account"){
    const txs=await rest("vote_transactions?select=reference,votes,amount_naira,payment_status,created_at&contestant_id=eq."+encodeURIComponent(account.id)+"&order=created_at.desc&limit=30");
    const ranked=await rest("contestants?select=id,contestant_code&status=eq.approved&order=vote_total.desc,last_vote_at.asc.nullslast,contestant_code.asc");
    const rank=ranked.findIndex((row:{id:string})=>row.id===account.id);
    return send({code:account.contestant_code,name:account.stage_name,city:account.city,state:account.state,category:account.category,bio:account.bio,status:account.status,votes:account.vote_total,rank:rank>=0?rank+1:null,supporter_transactions:txs.filter((t:{payment_status:string})=>t.payment_status==="simulated_success").length,transactions:txs.map((t:{payment_status:string,[key:string]:unknown})=>({reference:t.reference,votes:t.votes,amount_naira:t.amount_naira,status:t.payment_status,created_at:t.created_at})),created_at:account.created_at,simulated:true},200,origin);
   }
   if(action==="update_profile"){
    const name=String(data.stage_name||"").trim(),city=String(data.city||"").trim(),region=String(data.state||"").trim(),category=String(data.category||""),bio=String(data.bio||"").trim();
    if(!/^[A-Za-z0-9][A-Za-z0-9 .'-]{1,63}$/.test(name)||!/^[A-Za-z][A-Za-z .'-]{1,59}$/.test(city)||!/^[A-Za-z][A-Za-z .'-]{1,59}$/.test(region)||
       !["Worship vocalist","Gospel songwriter","Praise vocalist","Contemporary worship","Inspirational vocalist"].includes(category)||bio.length>280||/https?:\/\/|www\.|[<>]/i.test(bio))throw Error("Invalid fictional profile details");
    const day=new Date(Date.now()-86400000).toISOString();
    const changes=await rest("demo_profile_changes?select=id&contestant_id=eq."+encodeURIComponent(account.id)+"&changed_at=gte."+encodeURIComponent(day)+"&limit=21");
    if(changes.length>=20)throw Error("Demo profile edit limit reached");
    const updated=await rest("contestants?id=eq."+encodeURIComponent(account.id)+"&status=eq.approved&select=contestant_code","PATCH",{stage_name:name,city,state:region,category,bio});
    if(!updated.length)throw Error("Contestant cannot be edited while inactive");
    await rest("demo_profile_changes","POST",{contestant_id:account.id});
    return send({saved:true,code:account.contestant_code,name,simulated:true},200,origin);
   }
   if(action==="media_list"){
    const rows=await rest("contestant_media?select=id,title,source_url,source_kind,status,submitted_at&contestant_code=eq."+encodeURIComponent(account.contestant_code)+"&order=submitted_at.desc");
    return send({items:rows.map((x:{id:string,title:string,source_url:string,source_kind:string,status:string,submitted_at:string})=>({id:x.id,title:x.title,url:x.source_url,kind:x.source_kind,status:x.status,submitted_at:x.submitted_at})),simulated:true},200,origin);
   }
   if(action==="media_submit"){
    if(account.status!=="approved")throw Error("An approved fictional contestant account is required");
    const title=String(data.title||"").trim(),source=String(data.url||"").trim();
    if(title.length<3||title.length>90||/https?:\/\/|[<>]/i.test(title)||source.length>300)throw Error("Invalid media title or link");
    const link=supportedMedia(source);
    const rows=await rest("contestant_media?select=id&contestant_code=eq."+encodeURIComponent(account.contestant_code));
    if(rows.length>=5)throw Error("This demo supports at most five media submissions per contestant");
    const inserted=await rest("contestant_media?select=id","POST",{contestant_code:account.contestant_code,title,source_url:source,source_kind:link.kind,youtube_id:link.youtubeId,status:"pending"});
    if(!inserted.length)throw Error("Could not queue performance");
    return send({queued:true,id:inserted[0].id,status:"pending",code:account.contestant_code,simulated:true},200,origin);
   }
   throw Error("Unsupported action");
  }catch(e){
   const msg=String(e);
   const known=["No TFTC contestant is linked to this email account","Invalid fictional profile details","Demo profile edit limit reached",
    "Contestant cannot be edited while inactive","An approved fictional contestant account is required","Enter a short title and an allowed external media URL",
    "Use a standard YouTube or SoundCloud link","This demo supports at most five media submissions per contestant","This media URL has already been submitted"];
   return send({error:known.find(x=>msg.includes(x))||"The contestant account request could not be completed."},400,origin);
  }
 }

 let rpc:string;let params:Record<string,unknown>;
 if(input.action==="media_submit"||input.action==="media_list"){
  if(!isUuid(input.access_token))return send({error:"Enter a valid demo access code."},400,origin);
  if(input.action==="media_submit"){
   if(typeof input.title!=="string"||input.title.length>90||typeof input.url!=="string"||input.url.length>300)return send({error:"Provide a title and a YouTube or SoundCloud URL."},400,origin);
   rpc="submit_demo_media";params={p_access_token:input.access_token,p_title:input.title,p_url:input.url};
  }else{rpc="list_my_demo_media";params={p_access_token:input.access_token};}
 }else if(input.action==="login"){
  if(!isUuid(input.access_token))return send({error:"Enter a valid demo access code."},400,origin);
  rpc="get_demo_contestant_account";
  params={p_access_token:input.access_token};
 }else if(input.action==="update_profile"){
  if(!isUuid(input.access_token)||
    typeof input.stage_name!=="string"||input.stage_name.length>64||
    typeof input.city!=="string"||input.city.length>60||
    typeof input.state!=="string"||input.state.length>60||
    typeof input.category!=="string"||input.category.length>60||
    typeof input.bio!=="string"||input.bio.length>280)
    return send({error:"Complete the fictional profile fields."},400,origin);
  rpc="update_demo_contestant_profile";
  params={p_access_token:input.access_token,
    p_name:input.stage_name,p_city:input.city,p_state:input.state,
    p_category:input.category,p_bio:input.bio};
 }else{
  if(!isUuid(input.reference)||!isUuid(input.access_token)||
    typeof input.stage_name!=="string"||input.stage_name.length>64||
    typeof input.city!=="string"||input.city.length>60||
    typeof input.state!=="string"||input.state.length>60||
    typeof input.category!=="string"||input.category.length>60||
    typeof input.bio!=="string"||input.bio.length>280||
    input.age_confirmed!==true||input.consent_agreed!==true||
    typeof input.simulate_success!=="boolean")
    return send({error:"Complete all required fictional registration fields and consent."},400,origin);
  const ip=(req.headers.get("cf-connecting-ip")||
    req.headers.get("x-real-ip")||
    (req.headers.get("x-forwarded-for")||"").split(",")[0]||"unidentified").trim().slice(0,64);
  const fingerprint=await sha(secret.slice(0,32)+":"+ip);
  rpc="register_demo_contestant";
  params={
   p_reference:input.reference,p_access_token:input.access_token,
   p_name:input.stage_name,p_city:input.city,p_state:input.state,
   p_category:input.category,p_bio:input.bio,
   p_fingerprint_hash:fingerprint,p_success:input.simulate_success
  };
 }
 try{
  const response=await fetch(url+"/rest/v1/rpc/"+rpc,{
   method:"POST",
   headers:{apikey:secret,Authorization:"Bearer "+secret,"Content-Type":"application/json","Accept":"application/json"},
   body:JSON.stringify(params),signal:AbortSignal.timeout(15000)
  });
  if(!response.ok){
   const txt=await response.text();
   const known=["Invalid sample registration details","Demo registration limit reached",
    "Demo contestant registration is full","Invalid or expired demo access code",
    "Registration reference already used","Invalid fictional profile details",
    "Demo profile edit limit reached","Contestant cannot be edited while inactive",
    "Enter a short title and an allowed external media URL","Use a standard YouTube or SoundCloud link",
    "An approved fictional contestant access code is required","This demo supports at most five media submissions",
    "This media URL has already been submitted"];
   const msg=known.find(x=>txt.includes(x))||"The demonstration account request could not be completed.";
   return send({error:msg},msg.includes("limit")?429:400,origin);
  }
  const result=await response.json();
  if(input.action==="media_list")return send({items:result,simulated:true},200,origin);
  return send({...result,simulated:true},200,origin);
 }catch{return send({error:"The demo account service is temporarily unavailable."},503,origin);}
});
