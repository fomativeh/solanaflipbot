const { default: axios } = require("axios");
const User = require("../models/userModel");
const handleError = require("./handleError");

module.exports = withdraw = async (ctx, entryStatus) => {
  try {
    const { id } = ctx.from;
    const userData = await User.findOne({ chatId: id });
    if (!userData) return;

    const { balance } = userData;
    if (balance == 0) {
      return await ctx.reply(
        `Your balance is $0.\nPlease use the /deposit command to fund your account.`
      );
    }

    const res = await axios.get("https://api.bitfinex.com/v1/pubticker/solusd");
    const currentSolPriceInUsd = res.data.last_price;

    const balanceInSol = balance / currentSolPriceInUsd;
    entryStatus.isWithdrawing = true;

    const replyText = `You account balance is:\n*$${balance}* (${balanceInSol} sol)
    
Enter the amount you wish to withdraw (in usd):`;

    ctx.reply(replyText, { parse_mode: "Markdown" });
  } catch (error) {
    handleError(ctx, error);
  }
};
