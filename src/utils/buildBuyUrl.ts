export function buildBuyUrl(app: number, channel: number, item: number) {
  return `https://pagostore.garena.com/buy?app=${app}&channel=${channel}&item=${item}`;
}
