/**
 * /app/api/wallet/route.ts
 *
 * POST   /api/wallet  — create or update encrypted wallet
 * GET    /api/wallet?address=0x…  — fetch encrypted blob
 * DELETE /api/wallet?address=0x…  — delete wallet + related data
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import WalletModel from '@/models/Wallet';
import TokenModel from '@/models/Token';
import TransactionModel from '@/models/Transaction';

// ─── POST: Save/Update encrypted wallet ───────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { walletAddress, encryptedBlob, salt, iv, passwordHash } = body;

    if (!walletAddress || !encryptedBlob || !salt || !iv || !passwordHash) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Upsert: create if not exists, update if exists
    const wallet = await WalletModel.findOneAndUpdate(
      { walletAddress },
      { encryptedBlob, salt, iv, passwordHash },
      { upsert: true, new: true, runValidators: true }
    );

    return NextResponse.json({ success: true, walletAddress: wallet.walletAddress });
  } catch (error) {
    console.error('[POST /api/wallet]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ─── GET: Fetch encrypted blob ─────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const address = searchParams.get('address');

    if (!address) {
      return NextResponse.json({ error: 'address param is required' }, { status: 400 });
    }

    const wallet = await WalletModel.findOne({ walletAddress: address }).lean();

    if (!wallet) {
      return NextResponse.json({ exists: false }, { status: 200 });
    }

    return NextResponse.json({
      exists: true,
      encryptedBlob: wallet.encryptedBlob,
      salt:          wallet.salt,
      iv:            wallet.iv,
      passwordHash:  wallet.passwordHash,
    });
  } catch (error) {
    console.error('[GET /api/wallet]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ─── DELETE: Remove wallet and all related data ────────────────────────────────
export async function DELETE(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const address = searchParams.get('address');

    if (!address) {
      return NextResponse.json({ error: 'address param is required' }, { status: 400 });
    }

    await WalletModel.deleteOne({ walletAddress: address });
    await TokenModel.deleteMany({ walletAddress: address });
    await TransactionModel.deleteMany({ walletAddress: address });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/wallet]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
