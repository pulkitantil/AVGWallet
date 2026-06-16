/**
 * /app/api/wallet/route.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import WalletModel from '@/models/Wallet';
import TokenModel from '@/models/Token';
import TransactionModel from '@/models/Transaction';

// ─── Simple rate limiter (in-memory) ──────────────────────────────────────────
const rateMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + 60_000 }); // 1 minute window
    return false;
  }

  if (entry.count >= 20) return true; // max 20 requests per minute per IP

  entry.count++;
  return false;
}

// ─── Get caller IP ─────────────────────────────────────────────────────────────
function getIP(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0] ?? 
    req.headers.get('x-real-ip') ?? 
    'unknown'
  );
}

// ─── POST: Save/Update encrypted wallet ───────────────────────────────────────
export async function POST(req: NextRequest) {
  // Rate limit check
  if (isRateLimited(getIP(req))) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    await connectDB();
    const body = await req.json();
    const { walletAddress, encryptedBlob, salt, iv, passwordHash } = body;

    if (!walletAddress || !encryptedBlob || !salt || !iv || !passwordHash) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Basic format validation
    if (!walletAddress.startsWith('0x') || walletAddress.length !== 42) {
      return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 });
    }

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
  if (isRateLimited(getIP(req))) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const address = searchParams.get('address');

    if (!address) {
      return NextResponse.json({ error: 'address param is required' }, { status: 400 });
    }

    // Basic format validation
    if (!address.startsWith('0x') || address.length !== 42) {
      return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 });
    }

    const wallet = await WalletModel.findOne({ walletAddress: address }).lean();

    if (!wallet) {
      return NextResponse.json({ exists: false }, { status: 200 });
    }

    return NextResponse.json({
      exists:        true,
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
  if (isRateLimited(getIP(req))) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const address = searchParams.get('address');

    if (!address) {
      return NextResponse.json({ error: 'address param is required' }, { status: 400 });
    }

    if (!address.startsWith('0x') || address.length !== 42) {
      return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 });
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