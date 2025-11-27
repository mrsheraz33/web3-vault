# Web3 Vault Backend

Complete Node.js/TypeScript backend for secure Web3 wallet authentication and token vault management.

## Features
-  Wallet Authentication with Signature Verification
-  ERC-20 Token Allowance Checking
-  Secure Deposit Transactions
-  Real-time Blockchain Event Tracking
-  MongoDB Integration

## API Endpoints
- POST `/auth/challenge` - Generate login challenge
- POST `/auth/verify` - Verify signature & create session
- GET `/vault/allowance` - Check token allowance
- POST `/vault/deposit` - Create deposit transaction
- POST `/vault/submit` - Submit signed transaction

## Setup
1. `npm install`
2. Configure `.env` file
3. `npm run dev`
