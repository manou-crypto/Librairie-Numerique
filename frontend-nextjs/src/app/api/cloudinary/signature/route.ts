import { NextResponse } from 'next/server';
import { API_BASE_URL } from '@/lib'; // You might need to adjust this depending on how getAuthHeaders is imported if you need auth for signature

export async function GET(request: Request) {
  try {
    // Ideally we should pass auth headers if the backend requires them for the signature endpoint.
    // For now we assume the signature endpoint is public or we pass the token from cookies.
    const response = await fetch(
      `${API_BASE_URL || 'http://localhost:3000/api'}/v1/cloudinary/signature`
    );

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
