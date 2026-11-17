/**
 * Can this email domain receive mail? (server only)
 *
 * Looks up the domain's mail servers (MX records, or an address record as
 * a fallback). A domain with none, or that doesn't exist, can't receive email,
 * so it's almost always a typo. Lookups that time out or error count as fine,
 * and a "no such domain" only counts if gmail.com resolves at the same moment
 * (so broken DNS never blocks every email): it only blocks when we're sure.
 */
import { promises as dns } from "node:dns";

const NO_DOMAIN = new Set(["ENOTFOUND", "ENODATA", "NXDOMAIN"]);

/** true / false when sure, null when the lookup itself failed */
async function hasMail(domain: string): Promise<boolean | null> {
  try {
    const mx = await dns.resolveMx(domain);
    if (mx.some((r) => r.exchange && r.exchange !== ".")) return true;
  } catch (err) {
    if (!NO_DOMAIN.has((err as NodeJS.ErrnoException).code ?? "")) return null;
  }
  // no MX: mail can still go to the domain's own address
  try { return (await dns.resolve4(domain)).length > 0; }
  catch (err) { return NO_DOMAIN.has((err as NodeJS.ErrnoException).code ?? "") ? false : null; }
}

export async function canReceiveEmail(email: string): Promise<boolean> {
  const domain = email.slice(email.lastIndexOf("@") + 1).trim().toLowerCase();
  if (!domain) return false;
  const check = async () => {
    const result = await hasMail(domain);
    if (result !== false) return true;          // has mail, or unsure: allow
    // "no such domain": only believe it if a domain we know works resolves
    return (await hasMail("gmail.com")) !== true;
  };
  const timeout = new Promise<boolean>((resolve) => setTimeout(() => resolve(true), 3000));
  return Promise.race([check(), timeout]);
}
