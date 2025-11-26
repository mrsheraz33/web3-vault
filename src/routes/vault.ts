import express from 'express';
import { ethers } from 'ethers';
import jwt from 'jsonwebtoken'; // ADD THIS IMPORT
import { User } from '../models/User';

const router = express.Router();

// Middleware to verify JWT
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET!, (err: any, user: any) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Check ERC-20 allowance
router.get('/allowance', authenticateToken, async (req: any, res: any) => {
  try {
    const { tokenAddress } = req.query;
    const user = await User.findById(req.user.userId);
    
    // FIX: Check if user exists
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const tokenContract = new ethers.Contract(tokenAddress as string, [
      'function allowance(address owner, address spender) view returns (uint256)',
      'function decimals() view returns (uint8)'
    ], provider);

    const allowance = await tokenContract.allowance(user.walletAddress, process.env.MOCK_VAULT_ADDRESS);
    const decimals = await tokenContract.decimals();
    
    res.json({ 
      allowance: ethers.formatUnits(allowance, decimals),
      walletAddress: user.walletAddress,
      tokenAddress 
    });
  } catch (error) {
    res.status(500).json({ error: 'Allowance check failed' });
  }
});

// Create deposit transaction
router.post('/deposit', authenticateToken, async (req: any, res: any) => {
  try {
    const { amount, tokenAddress } = req.body;
    const user = await User.findById(req.user.userId);

    // FIX: Check if user exists
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const vaultContract = new ethers.Contract(process.env.MOCK_VAULT_ADDRESS!, [
      'function deposit(uint256 amount, address tokenAddress) external'
    ], provider);

    const tokenContract = new ethers.Contract(tokenAddress, [
      'function decimals() view returns (uint8)'
    ], provider);

    const decimals = await tokenContract.decimals();
    const amountInWei = ethers.parseUnits(amount.toString(), decimals);

    const transaction = await vaultContract.deposit.populateTransaction(amountInWei, tokenAddress);
    
    res.json({
      to: process.env.MOCK_VAULT_ADDRESS,
      from: user.walletAddress,
      data: transaction.data,
      value: '0x0',
      gasLimit: '0x100000',
      chainId: 11155111 // Sepolia
    });
  } catch (error) {
    res.status(500).json({ error: 'Transaction creation failed' });
  }
});

// Submit signed transaction
router.post('/submit', authenticateToken, async (req: any, res: any) => {
  try {
    const { signedTransaction } = req.body;
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    
    const txResponse = await provider.broadcastTransaction(signedTransaction);
    
    res.json({ 
      transactionHash: txResponse.hash,
      status: 'pending'
    });
  } catch (error) {
    res.status(500).json({ error: 'Transaction submission failed' });
  }
});

export default router;