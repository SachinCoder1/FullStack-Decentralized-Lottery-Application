import React from "react";
import { Loading } from "web3uikit";

export default function Btn(handleClick, disabled, children, title) {
  return (
    <button
      disabled={disabled}
      onClick={handleClick}
      className="cursor-pointer text-white bg-blue-500 px-4 py-2 rounded-md hover:bg-blue-600"
    >
      {children}
    </button>
  );
}
