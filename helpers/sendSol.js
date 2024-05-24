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
  amountInUsd
) => {
  // Replace with testnet endpoint
  const connection = new Connection(process.env.RPC_ENDPOINT);

  try {
    const secretKeyUint8Array = bs58.decode(secretKeyString);
    const from = Keypair.fromSecretKey(secretKeyUint8Array);
    
    const amount = amountInSol * LAMPORTS_PER_SOL;
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

    const replyText = `Withdrawal Successful✅🪙

${amount} sol ($${amountInUsd} usd) sent to your wallet address.

https://explorer.solana.com/tx/${signature}`;
    await ctx.reply(replyText);
    console.log("SOL SENT. SIGNATURE:", signature);
  } catch (error) {
    console.log("Error sending sol:", error);
    ctx.reply("Error processing withdrawal, please try again later☹️");
  }
};
