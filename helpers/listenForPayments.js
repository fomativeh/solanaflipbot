const { Connection, PublicKey, LAMPORTS_PER_SOL } = require("@solana/web3.js");
const Signature = require("../models/signatureModel");
const User = require("../models/userModel");
const { default: axios } = require("axios");
const { Telegraf } = require("telegraf");
const handleError = require("./handleError");
const bot = new Telegraf(process.env.BOT_TOKEN);
const Queue = require("queue-promise");
const Notification = require("../models/notificationModel");

const connection = new Connection(process.env.RPC_ENDPOINT, {
  commitment: "confirmed",
  maxSupportedTransactionVersion: 0,
});

const walletAddress = new PublicKey(process.env.RECIEVING_ADDRESS);

const queue = new Queue({
  concurrent: 1, // Process one request at a time
  interval: 1000, // Delay of 1 second between requests
});

const listenForPayments = async () => {
  // Create a random signature so that the array of signatures will be present for looping
  const randomSignatureCreated = await Signature.findOne({
    signature: "randomSignature",
  });
  if (!randomSignatureCreated) {
    const signatureForThisTransaction = new Signature({
      signature: "randomSignature",
    });
    await signatureForThisTransaction.save();
  }

  try {
    // Get the confirmed signatures for the wallet address
    const confirmedSignatures =
      await connection.getConfirmedSignaturesForAddress2(walletAddress, {
        maxSupportedTransactionVersion: 0,
      });
    const signatures = confirmedSignatures.map(({ signature }) => signature);

    // Add the signatures to the queue
    signatures.forEach((signature) => {
      queue.add(async () => {
        try {
          // Get the transaction for the signature
          const transaction = await connection.getTransaction(signature, {
            maxSupportedTransactionVersion: 0,
          });

          // Get the current SOL price in USD from Bitfinex
          const res = await axios.get(
            "https://api.bitfinex.com/v1/pubticker/solusd"
          );
          const currentSolPriceInUsd = res.data.last_price;

          // Access each transaction
          if (transaction !== undefined) {
            const amount =
              (transaction.meta.postBalances[1] -
                transaction.meta.preBalances[1]) /
              LAMPORTS_PER_SOL; // Convert to SOL units

            if(amount===0) return //Don't create alerts for 0 transfers
            // const senderAddress = transaction.transaction.message.accountKeys[0].toString();
            if (transaction.transaction.message.accountKeys) {
              const senderAddress =
                transaction.transaction.message.accountKeys[0].toString();
                // console.log(transaction.transaction.message.accountKeys)

              // Check if transaction has been saved
              const allSignatures = await Signature.find();
              if (allSignatures.length > 0) {
                const signatureExists = allSignatures.find(
                  (eachSignature) => eachSignature.signature == signature
                );

                // Store transaction and credit user if it hasn't been saved in db
                if (!signatureExists) {
                  const signatureForThisTransaction = new Signature({
                    signature,
                  });
                  await signatureForThisTransaction.save();

                  const sender = await User.findOne({
                    walletAddress: senderAddress,
                  });
                  if (sender) {
                    // console.log(sender, "credited", amount)
                    // console.log(sender, "sent", amount)
                    const creditAmount = currentSolPriceInUsd * amount;
                    // console.log(`${sender}, ${amount} sol, ${creditAmount} usd`);
                    const previousBalance = sender.balance;
                    const newBalance = parseFloat(
                      (previousBalance + creditAmount).toFixed(2)
                    );
                    await User.findOneAndUpdate(
                      { walletAddress: senderAddress },
                      { balance: newBalance }
                    );

                    // Create new credit notification
                    const creditNotification = new Notification({
                      message: `Deposit confirmed ✅ 
Amount: *${amount} sol*
*$${parseFloat(
                        creditAmount.toFixed(2)
                      )}* ([Using bitfinex rate](https://trading.bitfinex.com/t/SOL:USD?type=exchange))
New Balance: *$${newBalance}*`,
                      chatId: sender.chatId,
                    });
                    await creditNotification.save();
                  }
                }
              }
            }
          }
        } catch (error) {
          handleError(null, error);
        }
      });
    });
  } catch (error) {
    handleError(null, error);
  }

  // setTimeout(listenForPayments, 5000);
};

module.exports = listenForPayments;
