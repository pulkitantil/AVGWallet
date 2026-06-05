import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITransaction extends Document {
  walletAddress: string;
  hash:          string;
  from:          string;
  to:            string;
  value:         string;
  timestamp:     number;
  network:       string;
  status:        'pending' | 'confirmed' | 'failed';
  type:          'send' | 'receive';
  tokenSymbol?:  string;
  fee?:          string;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    walletAddress: { type: String, required: true, index: true },
    hash:          { type: String, required: true },
    from:          { type: String, required: true },
    to:            { type: String, required: true },
    value:         { type: String, required: true },
    timestamp:     { type: Number, required: true },
    network:       { type: String, required: true },
    status:        { type: String, enum: ['pending', 'confirmed', 'failed'], default: 'pending' },
    type:          { type: String, enum: ['send', 'receive'], required: true },
    tokenSymbol:   { type: String },
    fee:           { type: String },
  },
  { timestamps: true }
);

// Composite index so the same tx hash isn't duplicated per wallet+network
TransactionSchema.index({ walletAddress: 1, hash: 1, network: 1 }, { unique: true });

const Transaction: Model<ITransaction> =
  mongoose.models.Transaction ||
  mongoose.model<ITransaction>('Transaction', TransactionSchema);

export default Transaction;
