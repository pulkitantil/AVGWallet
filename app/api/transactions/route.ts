/**
 * /app/api/transactions/route.ts
 *
 * GET    /api/transactions?address=0x…[&network=ethereum][&limit=50]
 * POST   /api/transactions        — add a new transaction
 * PATCH  /api/transactions        — update status (pending → confirmed/failed)
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import TransactionModel from '@/models/Transaction';

// ─── GET: List transactions ──────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const address = searchParams.get('address');
    const network = searchParams.get('network');     // optional filter
    const limit   = parseInt(searchParams.get('limit') ?? '100', 10);

    if (!address) {
      return NextResponse.json({ error: 'address param is required' }, { status: 400 });
    }

    const query: Record<string, unknown> = { walletAddress: address };
    if (network) query.network = network;

    const transactions = await TransactionModel
      .find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json({ transactions });
  } catch (error) {
    console.error('[GET /api/transactions]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ─── POST: Add a transaction ─────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { walletAddress, hash, from, to, value, timestamp, network, status, type, tokenSymbol, fee } = body;

    if (!walletAddress || !hash || !from || !to || !value || !timestamp || !network || !type) {
      return NextResponse.json({ error: 'Missing required transaction fields' }, { status: 400 });
    }

    // Upsert so re-sending won't create duplicates
    const tx = await TransactionModel.findOneAndUpdate(
      { walletAddress, hash, network },
      { from, to, value, timestamp, status: status ?? 'pending', type, tokenSymbol, fee },
      { upsert: true, new: true, runValidators: true }
    );

    return NextResponse.json({ success: true, transaction: tx });
  } catch (error) {
    console.error('[POST /api/transactions]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ─── PATCH: Update transaction status ────────────────────────────────────────
export async function PATCH(req: NextRequest) {
  try {
    await connectDB();
    const { walletAddress, hash, network, status } = await req.json();

    if (!walletAddress || !hash || !network || !status) {
      return NextResponse.json({ error: 'walletAddress, hash, network and status required' }, { status: 400 });
    }

    if (!['pending', 'confirmed', 'failed'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
    }

    await TransactionModel.findOneAndUpdate(
      { walletAddress, hash, network },
      { status }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[PATCH /api/transactions]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
