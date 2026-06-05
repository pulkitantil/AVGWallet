import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * What is stored in MongoDB:
 *  - walletAddress  : Ethereum address (primary identifier — no user auth yet)
 *  - encryptedBlob  : AES-GCM ciphertext (base64)
 *  - salt           : PBKDF2 salt used to derive the AES key (base64)
 *  - iv             : AES-GCM IV (base64)
 *  - passwordHash   : PBKDF2 hash of the password (hex) — for login check
 *
 * The server NEVER sees the plaintext seed phrase or private keys.
 * Everything is encrypted in the browser before being sent here.
 */
export interface IWallet extends Document {
  walletAddress: string;   // Ethereum address — used as the unique user key
  encryptedBlob: string;   // base64 AES-GCM ciphertext
  salt: string;            // base64 PBKDF2 salt
  iv: string;              // base64 AES-GCM IV
  passwordHash: string;    // hex PBKDF2-SHA-256 hash (for login verification)
  createdAt: Date;
  updatedAt: Date;
}

const WalletSchema = new Schema<IWallet>(
  {
    walletAddress: { type: String, required: true, unique: true, index: true },
    encryptedBlob: { type: String, required: true },
    salt:          { type: String, required: true },
    iv:            { type: String, required: true },
    passwordHash:  { type: String, required: true },
  },
  { timestamps: true }
);

// Prevent model re-compilation during Next.js hot-reload
const Wallet: Model<IWallet> =
  mongoose.models.Wallet || mongoose.model<IWallet>('Wallet', WalletSchema);

export default Wallet;
