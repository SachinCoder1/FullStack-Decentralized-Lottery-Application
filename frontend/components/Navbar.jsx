import React, { useEffect } from "react";
import EnterLottery from "./EnterLottery";
import ConnectBtn from "./subComponents/btns/ConnectBtn";
import Logo from "./subComponents/logo/Logo";
// import { useMoralis } from "react-moralis";

export default function Navbar() {
  return (
    <div className="px-10 py-5 border-b-[1px] border-gray-200 flex justify-between items-center">
      <Logo />
      <ConnectBtn />
    </div>
  );
}
