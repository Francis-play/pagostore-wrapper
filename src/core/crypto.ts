import CryptoJS from "crypto-js"

const SECRET = "ph_secret_v1"

export function encrypt(data: string) {
  return CryptoJS.AES.encrypt(data, SECRET).toString()
}

export function decrypt(data: string) {
  const bytes = CryptoJS.AES.decrypt(data, SECRET)
  return bytes.toString(CryptoJS.enc.Utf8)
}