// TFTC demo withdrawal. Service credentials remain inside Supabase only.
const origins=[/^https:\/\/tftc-platform-dev\.vercel\.app$/,/^https:\/\/tftc-platform-[a-z0-9-]+\.vercel\.app$/,/^http:\/\/localhost:3000$/];
const originOk=(origin:string|null)=>!origin||origins.some(re=>re.test(origin));
function response(origin:string|null,body:unknown,status=200){
 const allowed=origin&&originOk(origin)?origin:"https://tftc-platform-dev.vercel.app";
 return new Response(JSON.stringify(body),{status,headers:{"Content-Type":"application/json","Cache-Control":"no-store","Access-Control-Allow-Origin":allowed,"Access-Control-Allow-Headers":"apikey,authorization,content-type","Access-Control-Allow-Methods":"POST,OPTIONS","Vary":"Origin"}});
}
const uuid=(value:unknown)=>typeof value==="string"&&/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
Deno.serve(async(req:Request)=>{
 const origin=req.headers.get("origin");
 if(!originOk(origin))return response(null,{error:"Origin not permitted."},403);
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers:response(origin,{}).headers});
 if(req.method!=="POST")return response(origin,{error:"POST only."},405);
 const endpoint=Deno.env.get("SUPABASE_URL");
 const secret=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
 let publishable="";
 try{publishable=JSON.parse(Deno.env.get("SUPABASE_PUBLISHABLE_KEYS")||"{}").default||""}catch{}
 if(!endpoint||!secret||!publishable)return response(origin,{error:"Demo withdrawal is unavailable."},503);
 if(req.headers.get("apikey")!==publishable)return response(origin,{error:"Invalid app key."},401);
 if(Number(req.headers.get("content-length")||0)>2048)return response(origin,{error:"Request too large."},413);
 let input:Record<string,unknown>={};
 try{input=await req.json()}catch{return response(origin,{error:"Invalid request."},400)}
 if(input.confirmation!=="WITHDRAW")return response(origin,{error:"Type WITHDRAW to confirm."},400);
 let owner:string|null=null;
 const bearer=req.headers.get("authorization")||"";
 if(bearer.startsWith("Bearer ")){
  const jwt=bearer.slice(7);
  if(jwt.length<30||jwt.length>4096)return response(origin,{error:"Invalid login session."},401);
  try{
   const verified=await fetch(endpoint+"/auth/v1/user",{headers:{apikey:publishable,Authorization:"Bearer "+jwt},signal:AbortSignal.timeout(10000)});
   if(!verified.ok)return response(origin,{error:"Sign in again."},401);
   const user=await verified.json();
   if(typeof user.id!=="string"||user.is_anonymous===true)return response(origin,{error:"Valid contestant account required."},401);
   owner=user.id;
  }catch{return response(origin,{error:"Cannot verify login session."},503)}
 }else if(!uuid(input.access_token)){
  return response(origin,{error:"Sign in or provide your private demo access code."},401);
 }
 const params={p_owner_user_id:owner,p_access_token:owner?null:input.access_token,p_confirmation:"WITHDRAW"};
 try{
  const done=await fetch(endpoint+"/rest/v1/rpc/tftc_demo_self_withdraw",{
   method:"POST",headers:{"Content-Type":"application/json",apikey:secret,Authorization:"Bearer "+secret},
   body:JSON.stringify(params),signal:AbortSignal.timeout(12000)
  });
  if(!done.ok)return response(origin,{error:"Unable to withdraw. Only active, owned accounts may withdraw."},400);
  const result=await done.json();
  return response(origin,{...result,simulated:true});
 }catch{return response(origin,{error:"Withdrawal service temporarily unavailable."},503)}
});