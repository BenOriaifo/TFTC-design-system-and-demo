// TFTC demo studio. Uses a separate high-entropy staff code stored only as a hash.
// This code is never published in the repo, database or public UI.
const origins=[
 /^https:\/\/tftc-platform-dev\.vercel\.app$/,
 /^https:\/\/tftc-platform-[a-z0-9-]+\.vercel\.app$/,
 /^https:\/\/tftc-platform-[a-z0-9-]+-koriai\.vercel\.app$/,
 /^http:\/\/localhost:3000$/
];
const allowed=(origin:string|null)=>!origin||origins.some(re=>re.test(origin));
const headers=(origin:string|null)=>({
 "Content-Type":"application/json","Cache-Control":"no-store",
 "Access-Control-Allow-Origin":origin&&allowed(origin)?origin:"https://tftc-platform-dev.vercel.app",
 "Access-Control-Allow-Methods":"POST,OPTIONS","Access-Control-Allow-Headers":"apikey,content-type",
 "Vary":"Origin"
});
const send=(value:unknown,status:number,origin:string|null)=>new Response(JSON.stringify(value),{status,headers:headers(origin)});
Deno.serve(async(req:Request)=>{
 const origin=req.headers.get("origin");
 if(!allowed(origin))return send({error:"Origin is not allowed."},403,null);
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers:headers(origin)});
 if(req.method!=="POST")return send({error:"POST only."},405,origin);
 let appKey="";
 try{appKey=JSON.parse(Deno.env.get("SUPABASE_PUBLISHABLE_KEYS")||"{}").default||"";}catch{}
 if(!appKey||req.headers.get("apikey")!==appKey)return send({error:"Invalid demo application key."},401,origin);
 const url=Deno.env.get("SUPABASE_URL"),key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
 if(!url||!key)return send({error:"Admin preview service is unavailable."},503,origin);
 let input:Record<string,unknown>;
 try{
  if(Number(req.headers.get("content-length")||"0")>8192)return send({error:"Request too large."},413,origin);
  input=await req.json();
 }catch{return send({error:"Invalid JSON."},400,origin);}
 const accessCode=input.access_code,action=input.action;
 if(typeof accessCode!=="string"||!/^[a-f0-9]{32}$/.test(accessCode)||
    typeof action!=="string"||
    !['overview','contestants','transactions','activity','reports','registrations','consents','top20','set_status','set_frozen','set_registration_frozen','set_phase','edit_profile','media_list','media_review'].includes(action))
     return send({error:"Valid staff demo access code and operation required."},401,origin);
 const payload=input.payload&&typeof input.payload==="object"&&!Array.isArray(input.payload)?input.payload:{};
 try{
  const isMedia=action==="media_list"||action==="media_review";
  const r=await fetch(url+"/rest/v1/rpc/"+(isMedia?"staff_demo_media":"tftc_demo_admin"),{
   method:"POST",headers:{apikey:key,Authorization:"Bearer "+key,"Content-Type":"application/json","Accept":"application/json"},
   body:JSON.stringify(isMedia?{p_access_code:accessCode,p_action:action==="media_list"?"list":"review",p_media_id:payload.id||null,p_status:payload.status||null,p_reason:payload.reason||null}:{p_access_code:accessCode,p_action:action,p_payload:payload}),
   signal:AbortSignal.timeout(15000)
  });
  if(!r.ok){
   const detail=await r.text();
   if(detail.includes("Invalid demo admin access code"))return send({error:"Incorrect staff demo access code."},401,origin);
   const errors=["Invalid contestant status request","Invalid demo competition phase","Invalid freeze request","Invalid contestant edit","Contestant not found","A media decision and reason are required","This media item is no longer pending"];
   const known=errors.find(s=>detail.includes(s));
   return send({error:known||"Admin demonstration action could not be completed."},400,origin);
  }
  return send({result:await r.json(),demo:true},200,origin);
 }catch{return send({error:"Admin demonstration service is temporarily unavailable."},503,origin);}
});
