"use client";

import { useState } from 'react';
import { ethers } from 'ethers';
// @ts-ignore
import contractData from '@/utils/CredentialSBT.json';
import { CONTRACT_ADDRESS } from '@/utils/contractAddress';

export default function VerifyPage() {
  const [tokenId, setTokenId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenId) return;

    setLoading(true);
    setResult(null);
    setError(null);

    try {
      if (typeof window.ethereum === 'undefined') {
        throw new Error("Please install MetaMask to interact with the blockchain.");
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractData.abi, provider);

      // Verify on-chain
      const [isValid, owner, uri] = await contract.verifyCredential(tokenId);

      // Fetch IPFS Metadata
      const gatewayUrl = uri.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/');
      let metadata = null;
      try {
        const res = await fetch(gatewayUrl);
        metadata = await res.json();

        // Decrypt sensitive fields
        if (metadata.attributes) {
          for (let i = 0; i < metadata.attributes.length; i++) {
            const attr = metadata.attributes[i];
            const encryptedFields = ["Encrypted Identity", "Social Security Number", "GPA"];
            if (encryptedFields.includes(attr.trait_type)) {
              try {
                const decryptRes = await fetch('/api/decrypt', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ encryptedData: attr.value })
                });
                const decryptData = await decryptRes.json();
                if (decryptRes.ok && decryptData.result) {
                  attr.value = decryptData.result + " (Decrypted ✅)";
                } else {
                  attr.value = attr.value + " (Encrypted 🔒)";
                }
              } catch (e) {
                attr.value = attr.value + " (Encrypted 🔒)";
              }
            }
          }
        }
      } catch (err) {
        console.error("Failed to load metadata", err);
      }

      setResult({
        isValid,
        owner,
        uri,
        metadata
      });

    } catch (err: any) {
      console.error(err);
      if (err.message.includes("Credential does not exist") || err.message.includes("ERC721NonexistentToken")) {
         setError("Invalid Credential: ID does not exist.");
      } else {
         setError(err.message || "An error occurred during verification.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h2>Verify Credential</h2>
        <p>Enter a Credential ID to instantly verify its authenticity on the blockchain.</p>
      </div>

      <div className="glass-panel" style={{ marginBottom: '2rem' }}>
        <form onSubmit={handleVerify} style={{ display: 'flex', gap: '1rem' }}>
          <input 
            type="text" 
            className="form-input" 
            placeholder="Enter Credential ID (e.g. 0x8f3c... or integer)" 
            value={tokenId}
            onChange={e => setTokenId(e.target.value)}
            style={{ flex: 1 }}
            required
          />
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Verifying...' : 'Verify Now'}
          </button>
        </form>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {result && (
        <div className="glass-panel" style={{ animation: 'fadeIn 0.5s ease' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
            <h3 style={{ margin: 0 }}>Verification Result</h3>
            {result.isValid ? (
               <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success)' }}>
                 <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                 <span style={{ fontWeight: 600, fontSize: '1.2rem' }}>VALID</span>
               </div>
            ) : (
               <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--error)' }}>
                 <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                 <span style={{ fontWeight: 600, fontSize: '1.2rem' }}>REVOKED / INVALID</span>
               </div>
            )}
          </div>

          <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: '130px 1fr' }}>
            <div style={{ color: 'var(--text-muted)' }}>Holder Address:</div>
            <div style={{ wordBreak: 'break-all', fontFamily: 'monospace' }}>{result.owner}</div>
            
            <div style={{ color: 'var(--text-muted)' }}>Status:</div>
            <div>{result.isValid ? 'Active ✓' : 'Revoked ✗'}</div>
          </div>

          {result.metadata && (
            <div style={{ marginTop: '2rem' }}>
              <h4 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>Off-Chain Metadata (IPFS)</h4>
              <div style={{ background: 'var(--background)', padding: '1.5rem', borderRadius: '8px' }}>
                <h3 style={{ marginTop: 0 }}>{result.metadata.name}</h3>
                <p style={{ marginBottom: '1.5rem' }}>{result.metadata.description}</p>
                
                {result.metadata.attributes?.map((attr: any, i: number) => {
                  let displayValue = attr.value;
                  return (
                    <div key={i} style={{ display: 'grid', gap: '1rem', gridTemplateColumns: '130px 1fr', marginBottom: '0.8rem', fontSize: '0.95rem' }}>
                      <div style={{ color: 'var(--text-muted)' }}>{attr.trait_type}:</div>
                      <div style={{ fontWeight: 500, wordBreak: 'break-all' }}>{displayValue}</div>
                    </div>
                  );
                })}

                {result.metadata.image && (
                  <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                    <a href={result.metadata.image.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/')} target="_blank" rel="noreferrer" className="btn-secondary">
                      View Source Document
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
