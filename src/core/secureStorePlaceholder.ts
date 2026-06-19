import * as Keychain from "react-native-keychain"

const SERVICE = "ph_pin"

const SecureStore = {
  async getPin(): Promise<string | null> {
    try {
      const res = await Keychain.getGenericPassword({ service: SERVICE })
      if (!res) return null
      return res.password
    } catch {
      return null
    }
  },

  async setPin(pin: string): Promise<boolean> {
    try {
      await Keychain.setGenericPassword(SERVICE, pin, { service: SERVICE })
      return true
    } catch {
      return false
    }
  },
}

export default SecureStore
