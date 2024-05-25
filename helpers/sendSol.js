const {
  PublicKey,
  Connection,
  LAMPORTS_PER_SOL,
  Keypair,
  Transaction,
  SystemProgram,
  sendAndConfirmTransaction,
} = require("@solana/web3.js");
const bs58 = require("bs58");

module.exports = sendSol = async (
  amountInSol,
  secretKeyString,
  recieverWalletAddress,
  ctx,
  entryStatus,
  amountInUsd,
  userData
) => {
  // Replace with testnet endpoint
  const connection = new Connection(process.env.RPC_ENDPOINT, {
    commitment: "confirmed",
    maxSupportedTransactionVersion: 0,
  });


  try {
    const secretKeyUint8Array = bs58.decode(secretKeyString);
    const from = Keypair.fromSecretKey(secretKeyUint8Array);
    
    const amount = Math.floor(amountInSol * LAMPORTS_PER_SOL);
    const solAmountToAnnounce = (amount/LAMPORTS_PER_SOL)

    await ctx.reply(
      `Sending $${amountInUsd} (${solAmountToAnnounce} sol) to your wallet address:\n\n${recieverWalletAddress}\n\nPlease wait...`
    );
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: from.publicKey,
        toPubkey: recieverWalletAddress,
        lamports: amount,
      })
    );

    // Get latest blockhash for transaction signing
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;

    // Sign transaction, broadcast, and confirm
    const signature = await sendAndConfirmTransaction(connection, transaction, [
      from,
    ]);

    entryStatus.isWithdrawing = false

    //Deduct balance
    userData.balance = parseFloat((userData.balance - amountInUsd).toFixed(2))
    await userData.save()

    const replyText = `Withdrawal Successful ✅ 🪙

$${amountInUsd} usd (${solAmountToAnnounce} sol) sent to your wallet address.

https://explorer.solana.com/tx/${signature}`;
    await ctx.reply(replyText);
    // console.log("SOL SENT. SIGNATURE:", signature);
  } catch (error) {
    console.log("Error sending sol:", error);
    ctx.reply("Error processing withdrawal, please try again later☹️");
  }
};
