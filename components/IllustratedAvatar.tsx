import React from 'react';

/** Deterministic, purely illustrative art. No real person's photograph is implied. */
export function IllustratedAvatar({code,name,className=''}:{code:string;name:string;className?:string}){
 const number=[...code].reduce((a,c)=>a+c.charCodeAt(0),0);
 const palettes=[['#d7e8ff','#2767c6','#edb88d','#223957'],['#d9eeff','#25708e','#a96942','#183c65'],['#e1ecff','#4264b0','#ac7653','#273953'],['#e4efff','#2e66b8','#d49b73','#203253'],['#d0e7f8','#1c6c99','#75432a','#2d4057']];
 const [bg,coat,skin,hair]=palettes[number%palettes.length];
 const suffix=code.replace(/[^A-Za-z0-9]/g,'');
 return <svg className={'tftc-illustrated-avatar '+className} viewBox="0 0 320 270" role="img" aria-label={'Fictional illustration placeholder for '+name} xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id={'avatar'+suffix} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={bg}/><stop offset="1" stopColor="#f7fbff"/></linearGradient></defs>
  <rect width="320" height="270" fill={'url(#avatar'+suffix+')'}/>
  <circle cx="261" cy="42" r="68" fill="#fff" opacity=".22"/><path d="M0 228 Q155 161 320 203 V270 H0Z" fill="#fff" opacity=".17"/>
  <path d="M48 279 Q48 193 160 185 Q272 193 272 279" fill={coat}/>
  <path d="M132 180 L132 209 Q160 233 188 209 L188 179" fill={skin}/>
  <ellipse cx="160" cy="125" rx="59" ry="73" fill={skin}/>
  <path d="M100 125 Q93 70 123 56 Q160 30 205 60 Q227 76 219 130 L208 101 Q176 92 154 69 Q129 95 105 100Z" fill={hair}/>
  <circle cx="138" cy="129" r="3" fill="#253044"/><circle cx="183" cy="129" r="3" fill="#253044"/>
  <path d="M145 157 Q160 168 175 157" stroke="#743f38" strokeWidth="3" fill="none" strokeLinecap="round"/>
  <path d="M134 199 L160 222 L186 199" fill="none" stroke="#fff" opacity=".85" strokeWidth="6" strokeLinecap="round"/>
 </svg>;
}
