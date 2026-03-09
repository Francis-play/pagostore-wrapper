import * as Keychain from 'react-native-keychain';

export type CardData = {
  name: string;
  number: string;
  expiry: string;
  email: string;
};

const KEY = 'ph_card';

export async function saveCard(card: CardData) {
  const payload = JSON.stringify(card);
  await Keychain.setGenericPassword(KEY, payload, {service: KEY});
}

export async function loadCard(): Promise<CardData | null> {
  const res = await Keychain.getGenericPassword({
    service: KEY,
  });
  if (!res) return null;
  return JSON.parse(res.password);
}

export async function clearCard() {
  await Keychain.resetGenericPassword({
    service: KEY,
  });
}
