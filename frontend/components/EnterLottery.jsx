import React, { useEffect, useState } from "react";
import { useWeb3Contract, useMoralis } from "react-moralis";
import { contractAddresses, abi } from "../constants";
import { ethers } from "ethers";
import { useNotification } from "web3uikit";

export default function EnterLottery() {
  const [entranceFee, setEntranceFee] = useState();
  const [recentWinner, setRecentWinner] = useState()
  const [allPlayers, setAllPlayers] = useState()

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

  const { runContractFunction: getEntranceFee } = useWeb3Contract({
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
    await enterLottery({
      onSuccess: handleSuccess,
      onError: (error) => console.log(error),
    });
  };


  // Notifications
  const handleSuccess = async (tx) => {
    await tx.wait(1);
    handleNewNotification(tx);
    getAll()
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

  const getAll = async () => {
    const getFee = (await getEntranceFee()).toString();
    const getNumOfPlayers = (await getNumbersOfPlayers()).toString();
    const getWinner = await getRecentWinner();
    setEntranceFee(getFee);
    setAllPlayers(getNumOfPlayers);
    setRecentWinner(getWinner);
  };
  useEffect(() => {
    if (isWeb3Enabled) {
      getAll();
    }
  }, [isWeb3Enabled]);

  return (
    <div>
      {lotteryAddress ? (
        <div>
          EnterLottery{" "}
          {entranceFee && ethers.utils.formatUnits(entranceFee, "ether")}
           <p>
            Total Players : {allPlayers && allPlayers};

           </p>
           <p>
            Recent Winner: {recentWinner && recentWinner}
           </p>
          <div>
            <button onClick={handleClick}>Enter Lottery</button>
          </div>
        </div>
      ) : (
        <div>Not valid address detected</div>
      )}
    </div>
  );
}
