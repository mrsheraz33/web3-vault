import express from 'express';
import jwt from 'jsonwebtoken';
import { ethers } from 'ethers';
import { User } from '../models/User';

const router = express.Router();

// Generate challenge message
router.post('/challenge', async (req, res) => {
  try {
    const { walletAddress } = req.body;
    
    const nonce = Math.floor(Math.random() * 1000000).toString();
    const nonceExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    await User.findOneAndUpdate(
      { walletAddress },
      { nonce, nonceExpiry },
      { upsert: true, new: true }
    );

    const message = `Please sign this message to authenticate: ${nonce}`;
    res.json({ message, nonce });
  } catch (error) {
    res.status(500).json({ error: 'Challenge generation failed' });
  }
});

// Verify signature and create session
router.post('/verify', async (req, res) => {
  try {
    const { walletAddress, signature } = req.body;
    
    const user = await User.findOne({ walletAddress });
    if (!user || !user.nonce) {
      return res.status(400).json({ error: 'Challenge not found' });
    }

    // FIX: Check if nonceExpiry exists before comparing
    if (!user.nonceExpiry || new Date() > user.nonceExpiry) {
      return res.status(400).json({ error: 'Challenge expired' });
    }

    // Verify signature
    const message = `Please sign this message to authenticate: ${user.nonce}`;
    const recoveredAddress = ethers.verifyMessage(message, signature);
    
    if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
      return res.status(400).json({ error: 'Invalid signature' });
    }

    // Clear nonce and create JWT
    user.nonce = undefined;
    user.nonceExpiry = undefined;
    await user.save();

    const token = jwt.sign(
      { userId: user._id, walletAddress }, 
      process.env.JWT_SECRET!, 
      { expiresIn: '24h' }
    );

    res.json({ token, user: { walletAddress, userId: user._id } });
  } catch (error) {
    res.status(500).json({ error: 'Verification failed' });
  }
});

export default router;