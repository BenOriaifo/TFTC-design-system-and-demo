import {ImageResponse} from 'next/og';
import {normaliseContestantCode} from '@/lib/share-utils.mjs';
import {getContestants} from '@/lib/data';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(request:Request){
 const code=normaliseContestantCode(new URL(request.url).searchParams.get('code'));
 if(!code)return new Response('Not found',{status:404,headers:{'Cache-Control':'no-store'}});
 const {rows}=await getContestants();
 const c=rows.find(r=>r.code===code);
 if(!c)return new Response('Not found',{status:404,headers:{'Cache-Control':'no-store'}});
 const category=c.category.length>46?c.category.slice(0,46)+'…':c.category;
 const title=c.name.length>46?c.name.slice(0,46)+'…':c.name;
 return new ImageResponse(
  <div style={{width:'100%',height:'100%',display:'flex',flexDirection:'column',justifyContent:'space-between',background:'#f5f9ff',color:'#141414',padding:'54px',fontFamily:'sans-serif'}}>
   <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
    <div style={{display:'flex',alignItems:'center',gap:'13px'}}>
     <div style={{display:'flex',width:52,height:52,alignItems:'center',justifyContent:'center',borderRadius:14,background:'#0066ff',color:'#fff',fontSize:30,fontWeight:900}}>T</div>
     <div style={{display:'flex',flexDirection:'column'}}><span style={{fontSize:25,fontWeight:800}}>THE FACE &amp; THE CROWN</span><span style={{fontSize:17,color:'#456b95'}}>TFTC LIVE SHOW · 2027</span></div>
    </div>
    <div style={{fontSize:18,fontWeight:700,background:'#e6effe',color:'#005ad9',borderRadius:99,padding:'11px 17px'}}>FICTIONAL DEMO</div>
   </div>
   <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>
    <div style={{fontSize:22,fontWeight:800,color:'#0066ff',letterSpacing:3}}>{code}</div>
    <div style={{fontSize:title.length>27?56:72,fontWeight:800,letterSpacing:-3,lineHeight:1.02,maxWidth:1030}}>{title}</div>
    <div style={{display:'flex',fontSize:25,color:'#4c6482'}}>{category} · {c.city}, Nigeria</div>
   </div>
   <div style={{borderTop:'2px solid #dbe5f5',paddingTop:22,display:'flex',justifyContent:'space-between',fontSize:23,fontWeight:700}}>
    <span>Explore the contestant. Try a demo vote.</span><span style={{color:'#0066ff'}}>No real payments</span>
   </div>
  </div>,{width:1200,height:630,headers:{'Cache-Control':'public, max-age=60, s-maxage=60'}}
 );
}
