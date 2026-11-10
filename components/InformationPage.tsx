import Link from 'next/link';

const bundles=[['1 vote','₦50'],['11 votes','₦500'],['25 votes','₦1,000'],['70 votes','₦2,500'],['155 votes','₦5,000'],['325 votes','₦10,000']];
const stages=[
 {name:'Registration',date:'1 to 31 January 2027',detail:'₦2,000 entry, minimum age 18 and up to 2,000 paid registrations.'},
 {name:'Public voting',date:'3 February to 2 March 2027',detail:'Votes are purchased in six bundles in the real event. All payments in this preview are simulated.'},
 {name:'Verification',date:'After voting closes',detail:'The leading 20 eligible contestants are reviewed before official qualification.'},
 {name:'Grand finale',date:'14 March 2027',detail:'The Face & The Crown Live Show grand finale.'}
];
const clauses=[
 {title:'Media and content usage',body:'The organizer proposes permission to use contestants’ names, biographies, photographs, videos and submitted performances in promotional and commercial media. The precise rights, duration and compensation language require legal review before real acceptance.'},
 {title:'Declaration and originality',body:'Contestants declare that they are at least 18 years old and that their details and performances are accurate and do not infringe third-party rights.'},
 {title:'Registration fee',body:'The proposed registration charge is ₦2,000. The brief describes a non-refundable fee even if a contestant withdraws or is disqualified, subject to client and legal review.'},
 {title:'Voting rules',body:'Voting is paid and uses the six stated packages. The brief proposes that completed votes are final and non-transferable, and manipulation or fake payments may lead to disqualification.'},
 {title:'Conduct and disqualification',body:'The organizer proposes the ability to disqualify contestants for misconduct, fraud, hate speech or other breaches of published competition rules.'},
 {title:'Show format and judging',body:'The highest 20 verified vote totals qualify for the grand finale. Ties are resolved by the first contestant to reach the tied score. Judges may influence the final live-show outcome under confirmed rules.'},
 {title:'Changes to the event',body:'The draft reserves a process for changes to dates, prizes or format due to unforeseen circumstances, with notice to participants. This provision requires confirmation.'},
 {title:'Acknowledgment',body:'In the finished platform, contestants should have the opportunity to review the final legal text before giving affirmative consent, and the system must record the version and timestamp.'}
];

export default function InformationPage({section}:{section:'about'|'rules'|'agreement'|'privacy'|'contact'}){
 if(section==='about')return <main className="wrap section info-page">
  <div className="eyebrow">ABOUT THE EXPERIENCE</div><h1>The Face &amp; The Crown Live Show.</h1>
  <p className="intro">Presented by Gospel Battle Wits, TFTC is a competition concept designed to celebrate emerging gospel music talent, develop community participation and spotlight the final 20 contestants.</p>
  <div className="info-feature"><div className="eyebrow">THE 2027 EDITION</div><h2>One stage. Many voices. One crown.</h2><p>Explore a contestant's journey from application to a personal profile, public supporter voting, the leaderboard and the grand finale. This public website is a connected fictional prototype, not the real competition.</p>
   <div className="actions"><Link className="btn" href="/contestants">Meet the contestants</Link><Link className="outline" href="/leaderboard">Explore rankings</Link></div></div>
  <h2>How the competition works</h2><div className="info-stage-grid">{stages.map((x,i)=><article key={x.name}><span>{String(i+1).padStart(2,'0')}</span><h3>{x.name}</h3><b>{x.date}</b><p>{x.detail}</p></article>)}</div>
  <h2>Prizes</h2><div className="info-prize-row"><div><span>1st prize</span><strong>₦500,000</strong></div><div><span>2nd prize</span><strong>₦300,000</strong></div><div><span>3rd prize</span><strong>₦100,000</strong></div></div>
  <p className="fine-print">All dates are in West Africa Time (UTC+1). Prize values and the event format are taken from website brief version 3 and remain subject to client confirmation.</p>
 </main>;
 if(section==='rules')return <main className="wrap section info-page">
  <div className="eyebrow">HOW THE CONTEST WORKS</div><h1>Competition rules.</h1>
  <p className="intro">A practical summary of the TFTC website brief, version 3. The final legally binding rules have not been approved for this prototype.</p>
  <div className="info-rule-grid">
   <article><h3>Who can enter?</h3><p>Contestants must be at least 18 years old. The proposed registration fee is ₦2,000, with a maximum of 2,000 paid registrations.</p></article>
   <article><h3>When are entries open?</h3><p>Registration: 1 to 31 January 2027 (WAT), subject to reaching capacity earlier.</p></article>
   <article><h3>When is voting?</h3><p>Voting: 3 February to 2 March 2027 (WAT). The full platform must verify payments before granting votes.</p></article>
   <article><h3>Who reaches the finale?</h3><p>After vote verification, the Top 20 qualify. Equal totals are ordered by the time each contestant first reached the tied score.</p></article>
   <article><h3>What happens if someone breaks the rules?</h3><p>Contestants may be suspended, rejected, withdrawn or disqualified under the organizer's confirmed procedures. Disqualified contestants cannot receive new votes.</p></article>
   <article><h3>How is the winner chosen?</h3><p>The final live show is scheduled for 14 March 2027. The brief allows judging at the finale, with details still to be confirmed.</p></article>
  </div>
  <h2>Proposed voting packages</h2>
  <div className="info-bundles">{bundles.map(([name,price])=><div key={name}><strong>{name}</strong><span>{price}</span></div>)}</div>
  <div className="info-feature"><h3>Important demo distinction</h3><p>This preview has no Paystack checkout, real refunds or live prize eligibility. The buttons record fictional simulated transactions only. The actual competition must verify payment references and enforce dates and consent before launch.</p><Link href="/agreement" className="outline">Read draft Content &amp; Media Agreement</Link></div>
 </main>;
 if(section==='agreement')return <main className="wrap section info-page">
  <div className="eyebrow">DRAFT FOR LEGAL AND CLIENT REVIEW · VERSION 3</div><h1>Content &amp; Media Agreement.</h1>
  <p className="intro">This is a demonstration summary of the proposed TFTC contestant agreement. It is not a legally approved contract and fictional checkbox tests do not create enforceable media rights.</p>
  <div className="info-legal-list">{clauses.map((c,i)=><article key={c.title}><span>{String(i+1).padStart(2,'0')}</span><div><h3>{c.title}</h3><p>{c.body}</p></div></article>)}</div>
  <div className="info-feature"><strong>Client and lawyer review needed</strong><p>The original brief proposes broad, irrevocable media rights, non-refundable fees and organizer discretion. A qualified Nigerian lawyer should review the final contract and applicable data-protection requirements before any real contestant accepts it.</p><Link href="/register" className="outline">Return to demo registration</Link></div>
 </main>;
 if(section==='privacy')return <main className="wrap section info-page">
  <div className="eyebrow">DEMONSTRATION DATA PROTECTION</div><h1>Privacy and data.</h1>
  <p className="intro">This page explains the fictional TFTC development preview. The client must approve a complete production privacy policy before collecting actual registrations or payments.</p>
  <div className="info-rule-grid">
   <article><h3>What is stored?</h3><p>Fictional stage names, public profile details, mock vote and registration transactions, test settings, consent-version records and account links are stored in the dedicated Supabase demo database. Fictional sign-in email addresses are stored separately in Supabase Authentication.</p></article>
   <article><h3>What is not uploaded?</h3><p>The registration preview does not submit or save the fictional phone number, date of birth, full legal name or selected photograph. Only a fictional email is saved in Supabase Authentication for account login.</p></article>
   <article><h3>Account access</h3><p>New contestants use email and password handled by Supabase Authentication. TFTC does not store plaintext passwords. The browser keeps a renewable login session; previously registered testers can temporarily use or link their old private demo access code.</p></article>
   <article><h3>Anti-abuse signals</h3><p>The demo records limited hashed network fingerprints to discourage repeated automated test transactions. It does not provide full production fraud protection.</p></article>
   <article><h3>Sharing and publication</h3><p>Public fictional profiles and aggregate simulated vote totals can be viewed by anyone who has the preview URL. Private access codes should never be posted publicly.</p></article>
   <article><h3>Future production requirements</h3><p>Actual user privacy notices, retention and deletion procedures, lawful-basis assessment, data subject rights, storage access rules and provider agreements need client and legal approval.</p></article>
  </div>
  <p className="fine-print">No real payment gateway or TFTC confirmation/SMS service is connected. Demo email addresses must use example.test, example.com, example.net or example.org. Confirmation emails are not sent; password recovery and verified delivery remain production work. Do not submit actual personal data to this public demo.</p>
 </main>;
 return <main className="wrap section info-page">
  <div className="eyebrow">ORGANIZER SUPPORT</div><h1>Contact the TFTC team.</h1>
  <p className="intro">The official support email, phone number and social accounts have not yet been confirmed by Gospel Battle Wits. They will be added after client approval.</p>
  <div className="info-feature"><h2>Need information about the show?</h2><p>For now, review the competition rules, explore fictional contestant profiles or use the sample registration experience to understand the planned platform.</p><div className="actions"><Link href="/rules" className="outline">Read the competition rules</Link><Link href="/register" className="btn">Explore registration</Link></div></div>
  <p className="fine-print">This demonstration does not collect contact form submissions or send messages. Please do not enter real contact details.</p>
 </main>;
}
