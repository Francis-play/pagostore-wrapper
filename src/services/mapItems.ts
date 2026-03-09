type StoreItem = {
  itemId: number;
  channelId: number;
  diamonds: number;
  price: number;
  image: string;
};

export function mapItems(items: any[]): StoreItem[] {
  return items.map(i => ({
    itemId: i.item_id,
    channelId: i.channel_id,
    diamonds: i.app_point_amount,
    price: i.currency_amount,
    image: i.image,
  }));
}
