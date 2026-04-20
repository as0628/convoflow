import CryptoJS from "crypto-js";

const SECRET_KEY = "convoflow_secret_key";

export const encryptMessage = (text) => {
  if (!text) return "";

  return CryptoJS.AES.encrypt(
    text,
    SECRET_KEY
  ).toString();
};

export const decryptMessage = (cipherText) => {
  if (!cipherText) return "";

  try {
    const bytes = CryptoJS.AES.decrypt(
      cipherText,
      SECRET_KEY
    );

    const originalText = bytes.toString(
      CryptoJS.enc.Utf8
    );

    return originalText || cipherText;
  } catch (error) {
    return cipherText;
  }
};