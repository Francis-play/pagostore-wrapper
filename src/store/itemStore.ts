type ItemMap = {
  [region: string]: any[];
};
const store: ItemMap = {};

export function saveItems(region: string, items: any[]) {
  store[region] = items;
}

export function getItems(region: string) {
  return store[region] || [];
}
