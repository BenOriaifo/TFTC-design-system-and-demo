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
 "Access-Control-Allow-Headers":"apikey,content-type","Access-Control-Allow-Methods":"POST,OPTIONS","Vary":"Origin"
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
 if(input.action!=="register"&&input.action!=="login"&&input.action!=="update_profile"&&input.action!=="media_submit"&&input.action!=="media_list")return send({error:"Unknown demo account action."},400,origin);
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
