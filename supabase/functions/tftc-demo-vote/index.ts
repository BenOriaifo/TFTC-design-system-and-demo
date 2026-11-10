// TFTC shared voting proof of concept. Never use for real payment verification.
const projectOrigins = [
  /^https:\/\/tftc-platform-dev\.vercel\.app$/,
  /^https:\/\/tftc-platform-[a-z0-9-]+\.vercel\.app$/,
  /^https:\/\/tftc-platform-[a-z0-9-]+-koriai\.vercel\.app$/,
  /^http:\/\/localhost:3000$/
];
const isAllowed = (origin: string | null) => !origin || projectOrigins.some(re => re.test(origin));
const headersFor = (origin: string | null) => ({
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
  "Access-Control-Allow-Origin": origin && isAllowed(origin) ? origin : "https://tftc-platform-dev.vercel.app",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
  "Access-Control-Allow-Headers": "apikey,content-type",
  "Vary": "Origin"
});
const respond = (data: unknown, status: number, origin: string | null) =>
  new Response(JSON.stringify(data), { status, headers: headersFor(origin) });
const validateCode = (s: unknown): s is string => typeof s === "string" && /^TFTC-\d{4}$/.test(s);
const validateReference = (s: unknown): s is string =>
  typeof s === "string" && /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(s);
const bundles = new Set([1,11,25,70,155,325]);
const bufferHex = (v: ArrayBuffer) => Array.from(new Uint8Array(v)).map(i => i.toString(16).padStart(2, "0")).join("");

Deno.serve(async req => {
  const origin = req.headers.get("origin");
  if (!isAllowed(origin)) return respond({ error: "Origin not permitted." }, 403, null);
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: headersFor(origin) });
  if (req.method !== "POST") return respond({ error: "POST only." }, 405, origin);

  // Authentication here checks app identity, not an end-user. Public demo only.
  let expectedKey = "";
  try { expectedKey = JSON.parse(Deno.env.get("SUPABASE_PUBLISHABLE_KEYS") || "{}").default || ""; } catch { /* fail closed */ }
  if (!expectedKey || req.headers.get("apikey") !== expectedKey)
    return respond({ error: "Invalid demo API key." }, 401, origin);

  const url = Deno.env.get("SUPABASE_URL"), serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) return respond({ error: "Voting service is not ready." }, 503, origin);
  let data: Record<string, unknown>;
  try {
    if (Number(req.headers.get("content-length") || "0") > 2048)
      return respond({ error: "Request too large." }, 413, origin);
    data = await req.json();
  } catch { return respond({ error: "Invalid JSON." }, 400, origin); }

  const { contestant_code, votes, reference, simulate_success } = data;
  if (!validateCode(contestant_code) || !validateReference(reference) ||
      typeof votes !== "number" || !bundles.has(votes) || typeof simulate_success !== "boolean")
    return respond({ error: "Invalid demo vote selection." }, 400, origin);

  // A hashed network fingerprint protects the public fictional ledger from accidental overuse.
  // This is NOT a production-grade anti-fraud system; proxies and rotating IPs can bypass it.
  const ip = (req.headers.get("cf-connecting-ip") ||
              req.headers.get("x-real-ip") ||
              (req.headers.get("x-forwarded-for") || "").split(",")[0] || "unidentified").trim().slice(0,64);
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(serviceKey.slice(0,32) + ":" + ip));
  const fingerprint = bufferHex(digest);
  try {
    const response = await fetch(url + "/rest/v1/rpc/record_demo_vote", {
      method:"POST",
      headers:{
        "Content-Type":"application/json",
        "apikey":serviceKey,
        "Authorization":"Bearer " + serviceKey,
        "Accept":"application/json"
      },
      body:JSON.stringify({
        p_reference:reference,
        p_code:contestant_code,
        p_votes:votes,
        p_fingerprint_hash:fingerprint,
        p_success:simulate_success
      }),
      signal:AbortSignal.timeout(15000)
    });
    if (!response.ok) {
      const message = await response.text();
      const known = ["Demo voting is closed","Contestant is not eligible",
        "Unsupported vote package","Demo voting rate limit reached",
        "Duplicate reference used for different vote"];
      const safe = known.find(s => message.includes(s)) || "The demo vote could not be recorded.";
      return respond({ error:safe }, safe.includes("rate limit")?429:400, origin);
    }
    const result = await response.json();
    return respond({ ...result, note:"Simulation only. No payment processed." }, 200, origin);
  } catch {
    return respond({ error:"The demo voting service is temporarily unavailable." },503,origin);
  }
});
