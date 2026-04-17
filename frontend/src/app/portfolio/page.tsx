"use client";

import { useState } from 'react';
import { ethers } from 'ethers';
import CryptoJS from 'crypto-js';
import WalletConnect from '@/components/WalletConnect';
// @ts-ignore
import contractData from '@/utils/CredentialSBT.json';
import { CONTRACT_ADDRESS } from '@/utils/contractAddress';

interface Credential {
  tokenId: string;
  uri: string;
  metadata: any;
  isValid: boolean;
}

export default function PortfolioPage() {
  const [address, setAddress] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCredentials = async (addr: string, provider: ethers.Provider) => {
    setLoading(true);
    setCredentials([]);
    setError(null);
    try {
      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractData.abi, provider);
      
      // Query CredentialIssued events for this address
      const filter = contract.filters.CredentialIssued(addr);
      // Look from block 0 to latest
      const events = await contract.queryFilter(filter, 0, 'latest');
      
      const creds: Credential[] = [];

      for (const event of events) {
        // @ts-ignore
        const tokenId = event.args[1].toString();
        // @ts-ignore
        const uri = event.args[2];

        // Check if valid/revoked
        const [isValid, owner] = await contract.verifyCredential(tokenId);

        // Fetch IPFS Metadata (we can use an IPFS HTTP gateway)
        const gatewayUrl = uri.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/');
        let metadata = { name: 'Unknown', description: 'Failed to load metadata' };
        try {
          const res = await fetch(gatewayUrl);
          metadata = await res.json();
        } catch (e) {
          console.error("Failed to load metadata for URI", uri);
        }

        // Must still be owned by user if we burned it it would skip, but we overridden transfer to only mint/revoke.
        if (owner === addr) {
          creds.push({ tokenId, uri, metadata, isValid });
        }
      }

      setCredentials(creds);
    } catch (err: any) {
      console.error(err);
      setError("Failed to fetch credentials. Are you on the right network?");
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = (addr: string, signer: ethers.Signer) => {
    setAddress(addr);
    // use normal provider for reading
    if (signer.provider) {
        fetchCredentials(addr, signer.provider);
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>My Portfolio</h2>
        <WalletConnect onConnect={handleConnect} />
      </div>

      {!address && (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem' }}>
          <p>Please connect your wallet to view your credentials.</p>
        </div>
      )}

      {error && <div className="alert alert-error">{error}</div>}

      {address && loading && <p>Loading credentials from blockchain...</p>}

      {address && !loading && credentials.length === 0 && !error && (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>No Credentials Found</h3>
          <p>It looks like you don't have any Soulbound Credentials yet.</p>
        </div>
      )}

      <div className="credential-grid">
        {credentials.map(c => (
           <div key={c.tokenId} className="glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <span className="wallet-badge" style={{ background: 'var(--surface)', color: 'var(--text)', display: 'inline-flex', alignItems: 'center' }}>
                  ID: #{c.tokenId}
                </span>
                {c.isValid ? (
                  <span className="wallet-badge" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', margin: 0, padding: '0.2rem 0.8rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: 'none' }}>Valid</span>
                ) : (
                  <span className="wallet-badge" style={{ background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)', color: 'white', margin: 0, padding: '0.2rem 0.8rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: 'none' }}>Revoked</span>
                )}
             </div>
             
             <h3 style={{ fontSize: '1.2rem' }}>{c.metadata.name}</h3>
             <p style={{ fontSize: '0.9rem', marginBottom: '1.5rem', flex: 1 }}>{c.metadata.description}</p>
             
             {c.metadata.attributes && (
               <div style={{ background: 'var(--background)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                  {c.metadata.attributes.map((attr: any, i: number) => {
                    let displayValue = attr.value;
                    if (attr.trait_type === "Encrypted Identity") {
                        try {
                           const bytes = CryptoJS.AES.decrypt(attr.value, 'TRUSTCHAIN_AES_KEY_2026');
                           displayValue = bytes.toString(CryptoJS.enc.Utf8) + " (Decrypted)";
                        } catch (e) {
                           displayValue = attr.value + " (Encrypted)";
                        }
                    }
                    return (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>{attr.trait_type}:</span>
                        <span style={{ fontWeight: 500, maxWidth: '60%', textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis' }}>{displayValue}</span>
                      </div>
                    );
                  })}
               </div>
             )}

             {c.metadata.image && (
                <a href={c.metadata.image.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/')} target="_blank" rel="noreferrer" className="btn-secondary" style={{ textAlign: 'center', fontSize: '0.9rem' }}>
                  View Original Document
                </a>
             )}
           </div>
        ))}
      </div>
    </div>
  );
}
