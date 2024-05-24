const User = require("../models/userModel");
const handleError = require("./handleError");

module.exports = handleWalletInput = async (
  ctx,
  walletAddress,
  entryStatus
) => {
  try {
    if (!walletAddress) {
      return await ctx.reply("Please enter a valid sol wallet address.");
    }

    if (walletAddress.length < 10) {
      return await ctx.reply("Please enter a valid sol wallet address.");
    }

    const walletExists = await User.findOne({ walletAddress });
    if (walletExists && !entryStatus.addressChange) {
      return await ctx.reply(
        "An account already exists with that sender wallet address.\nIf it is yours, please use that telegram account to start the bot."
      );
    }

    await User.findOneAndUpdate({ chatId: ctx.from.id }, { walletAddress });
    entryStatus.isSendingWalletAddress = false;
    await ctx.reply("Address saved.");

    //END HERE IF ADDRESS IS ONLY BEING CHANGED.
    if (entryStatus.addressChange) {
      entryStatus.addressChange = false;
      return;
    }

    let replyText = `To deposit, send sol to this wallet address:\n\n\`${process.env.RECIEVING_ADDRESS}\` (Click to copy)

You need at least $5 worth of sol to start a game. Make sure you only send sol or your funds will be lost⚠️
        
*Ensure you are paying with your registered sender address or we won't be able to track your payments!*
        
Your sender address:
\`${walletAddress}\` (Send money with this address only)

I will notify you upon payment confirmation.`;


    return await ctx.reply(replyText, {
      reply_markup: {
        inline_keyboard: [
          [{ text: "Change sender address", callback_data: "change-address" }],
        ],
      },
      parse_mode: "Markdown",
    });
  } catch (error) {
    console.log(error);
    handleError(ctx, error)
  }
};
