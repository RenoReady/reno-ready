/**
 * Catching email typos before we send (browser and server).
 *
 * suggestEmail("sam@gmial.com") → "sam@gmail.com": a close miss on a common
 * provider (Australian ones included) or a mistyped ".com". It only suggests;
 * the person decides. The server also checks the domain can receive email
 * (src/lib/emailDomain.ts).
 */

const DOMAINS = [
  "gmail.com", "outlook.com", "hotmail.com", "live.com", "yahoo.com", "icloud.com", "me.com",
  "outlook.com.au", "hotmail.com.au", "live.com.au", "yahoo.com.au",
  "bigpond.com", "bigpond.net.au", "optusnet.com.au", "iinet.net.au", "tpg.com.au", "internode.on.net",
];

/** Real providers that sit close to the ones above: never "correct" these */
const ALSO_REAL = ["mail.com", "gmx.com", "aol.com", "msn.com", "ymail.com", "proton.me", "protonmail.com", "hey.com", "zoho.com", "mac.com"];

const TLD_FIXES: Record<string, string> = {
  con: "com", cmo: "com", ocm: "com", vom: "com", xom: "com", comm: "com", coom: "com", om: "com",
  "com.ua": "com.au", "con.au": "com.au", "comau": "com.au", "net.ua": "net.au",
};

/** Edit distance where swapping two neighbouring letters counts as one (gmial → gmail) */
function distance(a: string, b: string): number {
  const d: number[][] = Array.from({ length: a.length + 1 }, (_, i) => Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)));
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
  }
  return d[a.length][b.length];
}

/** A corrected address if this one looks like a typo, else null */
export function suggestEmail(email: string): string | null {
  const at = email.lastIndexOf("@");
  if (at < 1) return null;
  const local = email.slice(0, at);
  const domain = email.slice(at + 1).trim().toLowerCase();
  if (!domain || DOMAINS.includes(domain) || ALSO_REAL.includes(domain)) return null;

  // a common provider, one or two letters off (gmial.com, hotmal.com, gmail.co)
  let best: string | null = null, bestD = 3;
  for (const d of DOMAINS) {
    const dist = distance(domain, d);
    if (dist < bestD && dist <= (d.length > 9 ? 2 : 1)) { best = d; bestD = dist; }
  }
  if (best) return `${local}@${best}`;

  // a mistyped ending on any domain (renoready.con, example.com.ua)
  for (const [bad, good] of Object.entries(TLD_FIXES)) {
    if (domain.endsWith(`.${bad}`)) return `${local}@${domain.slice(0, -bad.length)}${good}`;
  }
  return null;
}
