"use client";

import { useState } from 'react';
import { ethers } from 'ethers';
import CryptoJS from 'crypto-js';
import WalletConnect from '@/components/WalletConnect';
// We will assume the contract address is available locally, we can deploy it later in demo script
import contractData from '@/utils/CredentialSBT.json';

const CONTRACT_ADDRESS = "0x2706A171ECb68E0038378D40Dd1d136361d0cB7d"; // Local hardhat network first account deployed contract

export default function IssuerPortal() {
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [isIssuer, setIsIssuer] = useState<boolean | null>(null);
  const [debugError, setDebugError] = useState<string>('');

  // Form State
  const [studentAddress, setStudentAddress] = useState('');
  const [studentName, setStudentName] = useState('');
  const [institution, setInstitution] = useState('');
  const [major, setMajor] = useState('');
  const [gradYear, setGradYear] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const handleConnect = async (address: string, s: ethers.Signer) => {
    setSigner(s);
    try {
      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractData.abi, s);
      const ISSUER_ROLE = await contract.ISSUER_ROLE();
      const hasIssuerRole = await contract.hasRole(ISSUER_ROLE, address);
      setIsIssuer(hasIssuerRole);
    } catch (e: any) {
      console.error(e);
      setDebugError(e.message || "Unknown error");
      setIsIssuer(false);
    }
  };

  const hashData = async (data: string) => {
    const encoder = new TextEncoder();
    const dataBuf = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuf);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const handleIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signer || !file) return;

    setLoading(true);
    setStatus(null);

    try {
      // 1. Upload File to IPFS (via server proxy to hide pinata keys)
      const fileData = new FormData();
      fileData.append('file', file);
      fileData.append('action', 'uploadFile');

      setStatus({ type: 'success', message: 'Uploading document to IPFS...' });
      const fileRes = await fetch('/api/pinata', { method: 'POST', body: fileData });
      let fileJson = await fileRes.json();
      if (!fileRes.ok) throw new Error(fileJson.error);

      const fileCid = fileJson.ipfsHash;

      // 2. Hash sensitive data and construct metadata
      // The instructions say "Ensure personal information is hashed before it is submitted on-chain". 
      // We'll hash a mock ID number combined with institution as an example or just keep the regular data public and only hash sensitive parts.
      // Wait, the instructions said: Metadata Schema containing Institution, Major, Grad Year, Hash of Diploma PDF File
      
      const fileHash = await file.arrayBuffer().then(buf => crypto.subtle.digest('SHA-256', buf)).then(buf => Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join(''));

      // Encrypt sensitive data (AES)
      setStatus({ type: 'success', message: 'Encrypting sensitive data...' });
      const encryptedName = CryptoJS.AES.encrypt(studentName, 'TRUSTCHAIN_AES_KEY_2026').toString();

      const metadataObj = {
        name: `Credential for ${major}`,
        description: `Issued by ${institution} in ${gradYear}`,
        image: `ipfs://${fileCid}`,
        attributes: [
          { trait_type: "Institution", value: institution },
          { trait_type: "Major/Program", value: major },
          { trait_type: "Graduation Year", value: gradYear },
          { trait_type: "Encrypted Identity", value: encryptedName },
          { trait_type: "File Hash", value: fileHash }
        ]
      };

      // 3. Upload metadata
      setStatus({ type: 'success', message: 'Uploading metadata to IPFS...' });
      const metadataForm = new FormData();
      metadataForm.append('action', 'uploadJson');
      metadataForm.append('metadata', JSON.stringify(metadataObj));
      
      const metaRes = await fetch('/api/pinata', { method: 'POST', body: metadataForm });
      const metaJson = await metaRes.json();
      if (!metaRes.ok) throw new Error(metaJson.error);

      const tokenUri = `ipfs://${metaJson.ipfsHash}`;

      // 4. Issue credential on-chain
      setStatus({ type: 'success', message: 'Minting Soulbound Token...' });
      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractData.abi, signer);
      const tx = await contract.issueCredential(studentAddress, tokenUri);
      await tx.wait();

      setStatus({ type: 'success', message: `Credential issued successfully! TX: ${tx.hash}` });
      
    } catch (err: any) {
      console.error(err);
      setStatus({ type: 'error', message: err.message || 'Failed to issue credential' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h2>Issuer Portal</h2>
      <p style={{ marginBottom: '2rem' }}>Issue official credentials to students. Requires ISSUER_ROLE.</p>

      <div style={{ marginBottom: '2rem' }}>
        <WalletConnect onConnect={handleConnect} />
      </div>

      {status && (
        <div className={`alert ${status.type === 'success' ? 'alert-success' : 'alert-error'}`}>
          {status.message}
        </div>
      )}

      {signer && isIssuer === false && (
        <div className="alert alert-error" style={{ marginBottom: '2rem' }}>
          <div>
            <strong>⚠️ Unauthorized Wallet:</strong> You are currently connected with an account that does NOT have the Issuer Role. Please open MetaMask, switch to <strong>Account 1 / Account 0</strong> (the deployer), and ensure it is connected to use this portal.
            <br /><br />
            <small>Debug Error: {debugError}</small>
          </div>
        </div>
      )}

      {signer && isIssuer !== false && (
        <form onSubmit={handleIssue}>
          <div className="form-group">
            <label>Student Wallet Address</label>
            <input required type="text" className="form-input" placeholder="0x..." value={studentAddress} onChange={(e) => setStudentAddress(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Student Name (Sensitive - Will be encrypted via AES)</label>
            <input required type="text" className="form-input" placeholder="John Doe" value={studentName} onChange={(e) => setStudentName(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Institution Name</label>
            <input required type="text" className="form-input" value={institution} onChange={(e) => setInstitution(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Major / Program</label>
            <input required type="text" className="form-input" value={major} onChange={(e) => setMajor(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Graduation Year</label>
            <input required type="number" className="form-input" value={gradYear} onChange={(e) => setGradYear(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Diploma/Transcript File (PDF/Image)</label>
            <input required type="file" className="form-input" style={{ padding: '0.5rem' }} onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </div>
          
          <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Processing...' : 'Sign & Issue Credential'}
          </button>
        </form>
      )}
    </div>
  );
}
