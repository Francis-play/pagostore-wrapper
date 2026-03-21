/** Build the Pagostore buy URL.
 *  packed_role_id is always 0 — player identity is handled via DO_LOGIN in the WebView session. */
export function buildBuyUrl(app: number, channel: number, item: number): string {
  return `https://pagostore.garena.com/buy?app=${app}&channel=${channel}&item=${item}`
}
