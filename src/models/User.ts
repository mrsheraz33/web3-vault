import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  walletAddress: { type: String, required: true, unique: true },
  nonce: { type: String },
  nonceExpiry: { type: Date },
  portfolio: [{
    tokenAddress: String,
    balance: Number
  }]
});

export const User = mongoose.model('User', userSchema);