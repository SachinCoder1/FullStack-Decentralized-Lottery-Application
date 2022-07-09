import Moralis from "moralis/types";
import React, { useEffect } from "react";
import { useMoralis } from "react-moralis";

export default function Navbar() {
  const { enableWeb3, account, isWeb3Enabled, deactivateWeb3 } = useMoralis();
  const connectWeb3 = async () => {
    await enableWeb3();
    if (typeof window !== "undefined")
      window.localStorage.setItem("connected", "web3");
  };
  useEffect(() => {
    if (isWeb3Enabled) return;
    if (typeof window !== "undefined")
      if (window.localStorage.getItem("connected")) enableWeb3();
  }, [isWeb3Enabled]);

  useEffect(() => {
    Moralis.onAccountChanged((account) => {
      console.log("account changed to ", account);
      if (account == null) {
        window.localStorage.removeItem("connected");
        deactivateWeb3();
        console.log("No Account Found")
      }
    });
  }, [enableWeb3]);

  return (
    <div>
      {account ? (
        <p>
          Connected to {account} and {account.slice(0, 6)}...
          {account.slice(account.length - 4)}
        </p>
      ) : (
        <button onClick={connectWeb3}>Connect Wallet</button>
      )}
    </div>
  );
}
