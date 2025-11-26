import { ethers } from 'ethers';
import { User } from '../models/User';  // WITHOUT .js extension

export class EventListener {
  private provider: ethers.JsonRpcProvider;
  private vaultContract: ethers.Contract;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    this.vaultContract = new ethers.Contract(
      process.env.MOCK_VAULT_ADDRESS!,
      [
        'event Deposit(address indexed user, address indexed token, uint256 amount, uint256 vaultShares)'
      ],
      this.provider
    );
  }

  startListening() {
    this.vaultContract.on('Deposit', async (user: string, token: string, amount: bigint, vaultShares: bigint, event: any) => {
      try {
        console.log(`New deposit detected: ${user}, ${ethers.formatEther(amount)} tokens`);
        
        // Update user portfolio in database
        await User.findOneAndUpdate(
          { walletAddress: user.toLowerCase() },
          { 
            $push: { 
              portfolio: { 
                tokenAddress: token,
                balance: parseFloat(ethers.formatEther(amount))
              }
            }
          },
          { upsert: true }
        );
        
        console.log(`Portfolio updated for user: ${user}`);
      } catch (error) {
        console.error('Error updating portfolio:', error);
      }
    });

    console.log('Event listener started...');
  }
}