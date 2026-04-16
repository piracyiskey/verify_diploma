import type { Metadata } from "next";
import "./globals.css";
import Link from 'next/link';

export const metadata: Metadata = {
  title: "TrustChain Credentials",
  description: "Blockchain-Based Degree & Work Experience Verification System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <nav className="navbar">
          <div className="nav-links" style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--primary)' }}>
            <Link href="/">TrustChain</Link>
          </div>
          <div className="nav-links">
            <Link href="/issuer" className="nav-link">Issuer Portal</Link>
            <Link href="/portfolio" className="nav-link">My Portfolio</Link>
            <Link href="/verify" className="nav-link">Verify Credential</Link>
          </div>
        </nav>
        <main className="container">
          {children}
        </main>
      </body>
    </html>
  );
}
