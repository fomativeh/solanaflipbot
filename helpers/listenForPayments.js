const { Connection, PublicKey, LAMPORTS_PER_SOL } = require("@solana/web3.js");
const Signature = require("../models/signatureModel");
const User = require("../models/userModel");
const { default: axios } = require("axios");
const { Telegraf } = require("telegraf");
const handleError = require("./handleError");
const bot = new Telegraf(process.env.BOT_TOKEN);

const connection = new Connection(process.env.RPC_ENDPOINT);

const walletAddress = new PublicKey(process.env.RECIEVING_ADDRESS);

const listenForPayments = async () => {
  const signatureForThisTransaction = new Signature({ signature: "randomSignature" });
  await signatureForThisTransaction.save();
  // Set the interval for checking for new transactions (in milliseconds)
  const interval = 5000; // 5 second

  // Create a loop that will assess the transactions every 5 second
  setInterval(async () => {
  try {
    // Get the confirmed signatures for the wallet address
    const confirmedSignatures =
      await connection.getConfirmedSignaturesForAddress2(walletAddress);
    const signatures = confirmedSignatures.map(({ signature }) => signature);

    // Get the transactions for the signatures
    const transactions = await Promise.all(
      signatures.map((signature) => connection.getTransaction(signature))
    );

    //Get sol current price is usd from bitfinex
    const res = await axios.get("https://api.bitfinex.com/v1/pubticker/solusd");
    const currentSolPriceInUsd = res.data.last_price;

    // Access each transactions
    transactions.forEach(async (transaction) => {
      if (transaction !== undefined) {
        const currentSignature = transaction.transaction.signatures[0];
        const amount =
          (transaction.meta.postBalances[1] - transaction.meta.preBalances[1]) /
          LAMPORTS_PER_SOL; // Convert to SOL units
        const senderAddress =
          transaction.transaction.message.accountKeys[1].toString();

        //Check if transaction has been saved
        const allSignatures = await Signature.find();
        if (allSignatures.length > 0) {
          const signatureExists = allSignatures.find(
            (eachSignature) => eachSignature.signature == currentSignature
          );

          //Store transaction and credit user if it hasn't been saved in db
          if (!signatureExists) {
            const signatureForThisTransaction = new Signature({
              signature: currentSignature,
            });
            await signatureForThisTransaction.save();
        
            const sender = await User.findOne({
              walletAddress: senderAddress,
            });
            if (sender) {

              const creditAmount = currentSolPriceInUsd * amount;
              const previousBalance = sender.balance;
              const newBalance = parseFloat(
                (previousBalance + creditAmount).toFixed(2)
              );
              await User.findOneAndUpdate(
                { walletAddress: senderAddress },
                { balance: newBalance }
              );
              await bot.telegram.sendMessage(
                sender.chatId,
                `Deposit confirmed ✅\nAmount: ${amount} sol\n$${parseFloat(
                  creditAmount.toFixed(2)
                )}\nNew Balance: $${newBalance}`
              );
            }
          }
        }
      }
    });
  } catch (error) {
    handleError(error)
  }
  }, interval);
};

module.exports = listenForPayments;
