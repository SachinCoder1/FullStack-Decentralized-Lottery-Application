import React, { useEffect, useState } from "react";
import { useWeb3Contract, useMoralis } from "react-moralis";
import { contractAddresses, abi } from "../constants";
import { ethers } from "ethers";
import { Loading, useNotification } from "web3uikit";
import Btn from "./subComponents/btns/Btn";

export default function EnterLottery() {
  const [entranceFee, setEntranceFee] = useState();
  const [recentWinner, setRecentWinner] = useState();
  const [allPlayers, setAllPlayers] = useState();
  const [loading, setLoading] = useState(false);
  const [btnLoading, setBtnLoading] = useState(false);
  const [showFullAddress, setShowFullAddress] = useState(true)

  const { chainId: chainIdHex, isWeb3Enabled } = useMoralis();
  const dispatch = useNotification();

  const chainId = parseInt(chainIdHex);
  const lotteryAddress =
    chainId in contractAddresses ? contractAddresses[chainId][0] : null;

  const { runContractFunction: enterLottery } = useWeb3Contract({
    abi,
    contractAddress: lotteryAddress,
    functionName: "enterLottery",
    params: {},
    msgValue: entranceFee,
  });

  const {
    runContractFunction: getEntranceFee,
    isLoading,
    isFetching,
  } = useWeb3Contract({
    abi,
    contractAddress: lotteryAddress,
    functionName: "getEntranceFee",
    params: {},
  });

  const { runContractFunction: getNumbersOfPlayers } = useWeb3Contract({
    abi,
    contractAddress: lotteryAddress,
    functionName: "getNumbersOfPlayers",
    params: {},
  });

  const { runContractFunction: getRecentWinner } = useWeb3Contract({
    abi,
    contractAddress: lotteryAddress,
    functionName: "getRecentWinner",
    params: {},
  });

  const handleClick = async () => {
    setBtnLoading(true);
    await enterLottery({
      onSuccess: handleSuccess,
      onError: (error) => console.log(error),
    });
  };

  // Notifications
  const handleSuccess = async (tx) => {
    await tx.wait(1);
    handleNewNotification(tx);
    setBtnLoading(false);
    // getAll()
  };

  const handleNewNotification = () => {
    dispatch({
      type: "info",
      message: "Transaction Completed Successfully",
      title: "Transaction Notification",
      position: "topR",
      icon: "bell",
    });
  };

  useEffect(() => {
    if (isWeb3Enabled) {
      const getAll = async () => {
        const getFee = (await getEntranceFee()).toString();
        const getNumOfPlayers = (await getNumbersOfPlayers()).toString();
        const getWinner = await getRecentWinner();
        setEntranceFee(getFee);
        setAllPlayers(getNumOfPlayers);
        setRecentWinner(getWinner);
      };
      getAll();
    }
  }, [isWeb3Enabled]);

  return (
    <div className="px-10 py-5">
      {lotteryAddress ? (
        <div className="space-y-5">
          <p className=" text-[50px] text-blue-500 font-bold text-center space-x-5">
            Entrance Fee =
            <span className="text-green-500 px-5">
              {entranceFee && ethers.utils.formatUnits(entranceFee, "ether")} Ether
            </span>
          </p>
          <p className="text-4xl text-gray-300 font-semibold text-center">Players = <span className="text-blue-500">
          {allPlayers && allPlayers}
            </span> </p>
          <p className="flex items-center gap-x-2 justify-center"> <img className="w-20" src="/images/award-img.png" alt="Winner" /> <span className="text-3xl text-gray-300"> Recent Winner: {recentWinner && !showFullAddress ? recentWinner : recentWinner?.slice(0,6) + "..." + recentWinner?.slice(recentWinner?.length-6)} </span>
           <span>
            <button className="bg-blue-500 text-white px-3 py-1 rounded-md" onClick={() => setShowFullAddress(!showFullAddress)}>{showFullAddress ? "View" : "Hide"}</button>
           </span>
          </p>
          <div className="text-center">
            <button
              className="cursor-pointer mt-12 w-40 h-10 px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
              disabled={isFetching || isLoading || loading || btnLoading}
              onClick={handleClick}
            >
              {btnLoading || isLoading || isFetching ? (
                <div>
                  <Loading fontSize={20} direction="right" spinnerType="wave" />
                </div>
              ) : (
                <div>Enter Lottery</div>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div>Not valid address detected</div>
      )}
    </div>
  );
}
