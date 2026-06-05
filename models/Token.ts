import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IToken extends Document {
  walletAddress: string;
  address:       string;
  symbol:        string;
  name:          string;
  decimals:      number;
  balance:       string;
  network:       string;
  logo?:         string;
}

const TokenSchema = new Schema<IToken>(
  {
    walletAddress: { type: String, required: true, index: true },
    address:       { type: String, required: true },
    symbol:        { type: String, required: true },
    name:          { type: String, required: true },
    decimals:      { type: Number, required: true },
    balance:       { type: String, default: '0' },
    network:       { type: String, required: true },
    logo:          { type: String },
  },
  { timestamps: true }
);

// Composite unique index: one token per (walletAddress + address + network)
TokenSchema.index({ walletAddress: 1, address: 1, network: 1 }, { unique: true });

const Token: Model<IToken> =
  mongoose.models.Token || mongoose.model<IToken>('Token', TokenSchema);

export default Token;
