import { NextResponse } from 'next/server';
import CryptoJS from 'crypto-js';

export async function POST(request: Request) {
  try {
    const { encryptedData } = await request.json();

    if (!encryptedData) {
        return NextResponse.json({ error: "Encrypted data is required" }, { status: 400 });
    }

    if (!process.env.AES_SECRET_KEY) {
      return NextResponse.json({ error: "AES_SECRET_KEY not configured" }, { status: 500 });
    }

    const bytes = CryptoJS.AES.decrypt(encryptedData, process.env.AES_SECRET_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    
    return NextResponse.json({ result: decrypted });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Decryption failed" }, { status: 500 });
  }
}
