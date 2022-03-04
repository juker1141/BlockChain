import { useState, useEffect } from 'react';
import detectEthereumProvider from '@metamask/detect-provider';
import { ethers } from 'ethers';
import './App.css';
import abi from './contracts/NFTCollectible.json';

// 合約地址 - polygon testnet
const contractAddress = "0x456ba3CB23b103Fa3925FA1E48E3075646F3de3C";
// https://mumbai.polygonscan.com/address/0x456ba3CB23b103Fa3925FA1E48E3075646F3de3C#readContract

function App() {
  // 這邊的State基本上就是Redux Store的概念 只是區塊鏈不會只有一個 App.js
  // 所以才要使用 Redux 來分享給其他的元件、頁面
  const [provider, setProvider] = useState(null);
  const [currentAccount, setCurrentAccount] = useState(null);
  const [smartContract, setSmartContract] = useState(null);

  const [silverCardNum, setSilverCardNum] = useState(0);

  // 第一次進來網頁時嘗試建立 provider
  // 如果使用者沒有安裝套件，那就也不能建立 Provider
  const initProvider = async () => {
    const provider = await detectEthereumProvider();

    if (provider) {
      setProvider(provider);
    } else {
      console.log('請安裝MetaMask套件!');
    }
  }

  // 檢查使用者是否有安裝擴充套件
  // 這邊主要是如果使用者到這個階段了還沒有安裝小狐狸套件，那就不該讓他繼續執行
  const checkWalletIsConnected = async () => {
    if (!provider) {
      console.log("請確認是否安裝MetaMask!");
      return;
    } else {
      console.log("已安裝MetaMask，讓我們開始吧!");
    }

    // UX優化之一
    // 使用者如果早就連上了，自動幫他再次建立智能合約實例
    const accounts = await provider.request({ method: "eth_accounts" });
    console.log(accounts);

    if (accounts.length !== 0) {
      const account = accounts[0];
      console.log("找到既有連接的帳戶地址: ", account);
      setCurrentAccount(account);
    } else {
      console.log("沒有找到任何的帳戶");
    };
  };


  // 嘗試建立智能合約實例
  const initSmartContract = async () => {
    // 再次檢查是否有安裝小狐狸套件，有安裝才能繼續執行
    if (!provider) {
      console.log("請確認是否安裝MetaMask!");
      return;
    } else {
      console.log("已安裝MetaMask，讓我們開始吧!");
    }
    const providers = new ethers.providers.Web3Provider(provider);
    // 去抓取使用者地址
    const signer = providers.getSigner();
    // 建立智能合約實例需要 合約地址、ABI檔、使用者地址 三個參數
    const nftContract = new ethers.Contract(contractAddress, abi, signer);
    setSmartContract(nftContract);
  };

  // 當使用者按下按鈕連接的時候，對小狐狸套件發出請求
  const connectWalletHandler = async () => {
    try {
      // 這邊會跳出套件視窗給使用者去確認，如果使用者不連接，則會跑去 catch
      const accounts = await provider.request({ method: "eth_requestAccounts" });
      console.log("找到使用者帳戶! 帳戶地址: ", accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error);
    }
  };

  // 嘗試第一次喝智能合約交互
  // 這邊的範例是抓取銀卡第一章可兌換的數量
  const getSilverCard = async () => {
    const res = await smartContract.checkSilverCardRedeemAvailable(currentAccount, 1, 1);

    setSilverCardNum(res);
  };

  const connectWalletButton = () => {
    return (
      <button onClick={connectWalletHandler} className='cta-button connect-wallet-button'>
        連接錢包
      </button>
    )
  }

  const redeemNftButton = () => {
    return (
      <button className='cta-button mint-nft-button' disabled>
        兌換漫畫
      </button>
    )
  }

  // 監聽器 基本上大概是這個邏輯
  // 希望我們的程式都在確定有某個東西了以後才去執行
  // 當然這個寫法很醜很爛
  useEffect(() => {
    initProvider();
  }, []);

  useEffect(() => {
    if (!provider) return;

    checkWalletIsConnected();
  }, [provider]);

  useEffect(() => {
    if (!currentAccount) return;

    initSmartContract();
  }, [currentAccount]);

  useEffect(() => {
    if (!smartContract) return;
    
    getSilverCard();
  }, [smartContract]);

  return (
    <div className='main-app'>
      <h1>{currentAccount ? `我可以兌換 ${silverCardNum} 張第一章的銀卡` :"連接帳號以便開始" }</h1>
      <div>
        {currentAccount ? redeemNftButton() : connectWalletButton()}
      </div>
    </div>
  )
}

export default App;