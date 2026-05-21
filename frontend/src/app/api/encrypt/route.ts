import { NextResponse } from 'next/server';
import CryptoJS from 'crypto-js';

export async function POST(request: Request) {
  try {
    const { text } = await request.json();
    
    if (!text) {
        return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    if (!process.env.AES_SECRET_KEY) {
      return NextResponse.json({ error: "AES_SECRET_KEY not configured" }, { status: 500 });
    }

    const encrypted = CryptoJS.AES.encrypt(text, process.env.AES_SECRET_KEY).toString();
    return NextResponse.json({ result: encrypted });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Encryption failed" }, { status: 500 });
  }
}
