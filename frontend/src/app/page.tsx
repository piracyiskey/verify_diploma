import Link from 'next/link';

export default function Home() {
  return (
    <div style={{ padding: '4rem 0', textAlign: 'center' }}>
      <h1 style={{ fontSize: '3.5rem', marginBottom: '1.5rem' }}>
        TrustChain <span style={{ color: 'var(--primary)' }}>Credentials</span>
      </h1>
      <p style={{ fontSize: '1.2rem', maxWidth: '700px', margin: '0 auto 4rem auto' }}>
        A decentralized platform for verifiable degree and work experience credentials.
        Empowering students, educational institutions, and businesses with immutable, soulbound tokens (SBTs).
      </p>

      <div className="credential-grid">
        <Link href="/issuer">
          <div className="info-card" style={{ height: '100%', cursor: 'pointer' }}>
            <h2>🏫 Issuer Portal</h2>
            <p>For educational institutions and accredited businesses to securely issue Soulbound Credentials directly to student wallets. Upload diplomas securely to IPFS.</p>
            <div style={{ marginTop: '1rem', color: 'var(--primary)', fontWeight: 'bold' }}>Enter Portal &rarr;</div>
          </div>
        </Link>

        <Link href="/portfolio">
          <div className="info-card" style={{ height: '100%', cursor: 'pointer' }}>
            <h2>👩‍🎓 User Portfolio</h2>
            <p>For students and professionals to view and manage their decentralized credentials. Connect your wallet to access your soulbound tokens.</p>
            <div style={{ marginTop: '1rem', color: 'var(--primary)', fontWeight: 'bold' }}>View Portfolio &rarr;</div>
          </div>
        </Link>

        <Link href="/verify">
          <div className="info-card" style={{ height: '100%', cursor: 'pointer' }}>
            <h2>✅ Verifier Tool</h2>
            <p>For employers and third parties to instantly verify the authenticity of a degree or work certificate without waiting for background checks.</p>
            <div style={{ marginTop: '1rem', color: 'var(--primary)', fontWeight: 'bold' }}>Verify Now &rarr;</div>
          </div>
        </Link>
      </div>

      {/*
      <div style={{ marginTop: '5rem', padding: '2rem', background: 'rgba(99, 102, 241, 0.05)', borderRadius: '16px' }}>
        <h3 style={{ marginBottom: '1rem' }}>Built with Modern Web3 Technologies</h3>
        <p style={{ display: 'flex', gap: '2rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <span>⛓️ Ethereum (Hardhat)</span>
          <span>📁 IPFS (Pinata)</span>
          <span>🦊 MetaMask</span>
          <span>⚡ Next.js</span>
        </p>
      </div>
      */}

    </div>
  );
}
