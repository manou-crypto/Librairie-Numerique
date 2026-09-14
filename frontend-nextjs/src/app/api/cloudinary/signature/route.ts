import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const rawBackendUrl = (process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000').trim();
    const baseUrl = rawBackendUrl.replace(/\/api\/?$/, '').replace(/\/+$/, '');
    const response = await fetch(`${baseUrl}/api/v1/cloudinary/signature`);

    if (!response.ok) {
      throw new Error('Failed to fetch signature');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Signature error:', error);
    return NextResponse.json({ error: 'Failed to get signature' }, { status: 500 });
  }
}

