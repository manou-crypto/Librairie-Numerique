import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const rawBackendUrl = (
      process.env.BACKEND_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      'http://localhost:3000'
    ).trim();
    const baseUrl = rawBackendUrl.replace(/\/api\/?$/, '').replace(/\/+$/, '');

    const response = await fetch(`${baseUrl}/api/v1/cloudinary/signature`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend signature error response:', response.status, errorText);
      throw new Error(`Failed to fetch signature: ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Signature POST route error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to get signature' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const rawBackendUrl = (
      process.env.BACKEND_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      'http://localhost:3000'
    ).trim();
    const baseUrl = rawBackendUrl.replace(/\/api\/?$/, '').replace(/\/+$/, '');
    const response = await fetch(`${baseUrl}/api/v1/cloudinary/signature`);

    if (!response.ok) {
      throw new Error('Failed to fetch signature');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Signature GET route error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to get signature' },
      { status: 500 }
    );
  }
}


