"use client";

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

export default function WalletConnect({ onConnect }: { onConnect: (address: string, signer: ethers.Signer) => void }) {
  const [account, setAccount] = useState<string | null>(null);

  useEffect(() => {
    checkConnection();

    // Listen for MetaMask account or network changes
    if (typeof window.ethereum !== 'undefined') {
      const handleAccountsChanged = () => checkConnection();
      const handleChainChanged = () => window.location.reload();

      // @ts-ignore
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      // @ts-ignore
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        // @ts-ignore
        if (window.ethereum.removeListener) {
          // @ts-ignore
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
          // @ts-ignore
          window.ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
    }
  }, []);

  const checkConnection = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.listAccounts();
        if (accounts.length > 0) {
          const signer = await provider.getSigner();
          const address = await signer.getAddress();
          setAccount(address);
          onConnect(address, signer);
        }
      } catch (error) {
        console.error("Wallet connection failed", error);
      }
    }
  };

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        setAccount(address);
        onConnect(address, signer);
      } catch (error) {
        console.error("Connection rejected", error);
      }
    } else {
      alert("Please install MetaMask!");
    }
  };

  return (
    <div>
      {account ? (
        <span className="wallet-badge">
          Connected: {account.substring(0, 6)}...{account.substring(account.length - 4)}
        </span>
      ) : (
        <button className="btn-primary" onClick={connectWallet}>
          Connect MetaMask
        </button>
      )}
    </div>
  );
}
