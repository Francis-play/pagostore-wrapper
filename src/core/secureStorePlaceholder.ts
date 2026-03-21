/**
 * Placeholder secure store wrapper.
 * Replace with your secureStorage implementation (Keychain/EncryptedStorage).
 */
const SecureStore = {
  async getPin(){
    try {
      const v = await Promise.resolve(null);
      return v;
    } catch { return null; }
  },
  async setPin(_pin: string){
    try { return Promise.resolve(true); } catch { return false; }
  }
};

export default SecureStore;
