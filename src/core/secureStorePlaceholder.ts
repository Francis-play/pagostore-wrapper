/**
 * Placeholder secure store wrapper.
 * Replace with your secureStorage implementation (Keychain/EncryptedStorage).
 */
const SecureStore = {
  async getPin() {
    try {
      const v = await Promise.resolve(null);
      return v;
    } catch (e) {
      return null;
    }
  },
  async setPin(pin) {
    try {
      return Promise.resolve(true);
    } catch (e) {
      return false;
    }
  },
};

export default SecureStore;
