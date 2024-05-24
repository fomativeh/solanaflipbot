const { default: axios } = require("axios");
const User = require("../models/userModel");
const handleError = require("./handleError");
const sendSol = require("./sendSol");

module.exports = handleProcessWithdrawal = async (
  ctx,
  amountInUsd,
  entryStatus
) => {
  try {
    const { id } = ctx.from;
    const userData = await User.findOne({ chatId: id });
    if (!userData) return;

    const { balance, walletAddress } = userData;
    const res = await axios.get("https://api.bitfinex.com/v1/pubticker/solusd");
    const currentSolPriceInUsd = res.data.last_price;

    if (isNaN(amountInUsd)) {
      return await ctx.reply("Please enter a valid amount to withdraw.");
    }

    if (amountInUsd == 0) {
      return await ctx.reply(
        "You can't withdraw $0, please enter a valid amount to withdraw."
      );
    }

    if (amountInUsd > balance) {
      return await ctx.reply(
        `Insufficient funds.\nYour account balance is $${balance} (${balanceInSol} sol)\nPlease enter a lesser amount`
      );
    }

    const withdrawalAmountInSol = parseFloat(
      amountInUsd / currentSolPriceInUsd
    );

    //Send sol to user
    await sendSol(
      withdrawalAmountInSol,
      process.env.WALLET_SECRET_KEY,
      walletAddress,
      ctx,
      entryStatus,
      amountInUsd,
      userData
    );
  } catch (error) {
    handleError(ctx, error);
  }
};
