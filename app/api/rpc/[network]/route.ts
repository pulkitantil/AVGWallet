import { NextRequest, NextResponse } from 'next/server';

const ALCHEMY_URLS: Record<string, string> = {
  ethereum: 'https://eth-mainnet.g.alchemy.com/v2',
  polygon:  'https://polygon-mainnet.g.alchemy.com/v2',
  binance:  'https://bnb-mainnet.g.alchemy.com/v2',
  base:     'https://base-mainnet.g.alchemy.com/v2',
  solana:   'https://solana-mainnet.g.alchemy.com/v2',
  bitcoin:  'https://bitcoin-mainnet.g.alchemy.com/v2',
};

export async function POST(
  req: NextRequest,
  { params }: { params: { network: string } }
) {
  const network = params.network;
  const apiKey = process.env.ALCHEMY_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
  }

  const baseUrl = ALCHEMY_URLS[network];
  if (!baseUrl) {
    return NextResponse.json({ error: 'Unknown network' }, { status: 400 });
  }

  try {
    const body = await req.json();
    const response = await fetch(`${baseUrl}/${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'RPC request failed' }, { status: 500 });
  }
}