import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const action = formData.get('action');

    if (!process.env.PINATA_JWT) {
      return NextResponse.json({ error: "PINATA_JWT not configured in server" }, { status: 500 });
    }

    if (action === 'uploadFile') {
      const file = formData.get('file');
      if (!file) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 });
      }

      const pinataData = new FormData();
      pinataData.append('file', file);
      
      const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.PINATA_JWT}`
        },
        body: pinataData,
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.details || json.error || "Pinata API error");
      return NextResponse.json({ ipfsHash: json.IpfsHash });
      
    } else if (action === 'uploadJson') {
      const metadataStr = formData.get('metadata') as string;
      if (!metadataStr) {
         return NextResponse.json({ error: "No metadata provided" }, { status: 400 });
      }

      const res = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.PINATA_JWT}`
        },
        body: metadataStr,
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.details || json.error || "Pinata API error");
      return NextResponse.json({ ipfsHash: json.IpfsHash });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (error: any) {
    console.error("Pinata upload error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
