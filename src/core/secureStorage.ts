import * as Keychain from "react-native-keychain"
import CryptoJS from "crypto-js"

const SERVICE = "ph_card"

async function getKey() {
  const res = await Keychain.getGenericPassword({ service: "ph_key" })
  if (res) return res.password
  const key = CryptoJS.lib.WordArray.random(16).toString()
  await Keychain.setGenericPassword("ph", key, { service: "ph_key" })
  return key
}

export async function saveCard(card: any) {
  const key = await getKey()

  const encrypted = CryptoJS.AES.encrypt(
    JSON.stringify(card),
    key
  ).toString()

  await Keychain.setGenericPassword(
    "card",
    encrypted,
    { service: SERVICE }
  )
}

export async function getCard() {
  const res = await Keychain.getGenericPassword({ service: SERVICE })
  if (!res) return null
  const key = await getKey()
  const bytes = CryptoJS.AES.decrypt(res.password, key)
  return JSON.parse(
    bytes.toString(CryptoJS.enc.Utf8)
  )
}