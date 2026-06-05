/**
 * /app/api/tokens/route.ts
 *
 * GET    /api/tokens?address=0x…  — list tokens for a wallet
 * POST   /api/tokens               — add a token (upsert)
 * PUT    /api/tokens               — update token balance
 * DELETE /api/tokens               — remove a specific token
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import TokenModel from '@/models/Token';

// ─── GET: List tokens for wallet ────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const address = searchParams.get('address');

    if (!address) {
      return NextResponse.json({ error: 'address param is required' }, { status: 400 });
    }

    const tokens = await TokenModel.find({ walletAddress: address }).lean();
    return NextResponse.json({ tokens });
  } catch (error) {
    console.error('[GET /api/tokens]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ─── POST: Add / upsert a token ─────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { walletAddress, address, symbol, name, decimals, balance, network, logo } = body;

    if (!walletAddress || !address || !symbol || !name || decimals == null || !network) {
      return NextResponse.json({ error: 'Missing required token fields' }, { status: 400 });
    }

    const token = await TokenModel.findOneAndUpdate(
      { walletAddress, address, network },
      { symbol, name, decimals, balance: balance ?? '0', logo },
      { upsert: true, new: true, runValidators: true }
    );

    return NextResponse.json({ success: true, token });
  } catch (error) {
    console.error('[POST /api/tokens]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ─── PUT: Update token balance ──────────────────────────────────────────────
export async function PUT(req: NextRequest) {
  try {
    await connectDB();
    const { walletAddress, address, network, balance } = await req.json();

    if (!walletAddress || !address || !network || balance == null) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await TokenModel.findOneAndUpdate(
      { walletAddress, address, network },
      { balance }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[PUT /api/tokens]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ─── DELETE: Remove a token ──────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const walletAddress = searchParams.get('walletAddress');
    const address       = searchParams.get('address');
    const network       = searchParams.get('network');

    if (!walletAddress || !address || !network) {
      return NextResponse.json({ error: 'walletAddress, address, and network params required' }, { status: 400 });
    }

    await TokenModel.deleteOne({ walletAddress, address, network });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/tokens]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
