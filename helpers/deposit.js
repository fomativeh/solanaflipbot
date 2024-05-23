const User = require("../models/userModel");
const handleError = require("./handleError");

const createAccountIfNull = async (ctx) => {
  try {
    const { id } = ctx.from;
    const userData = await User.findOne({ chatId: id });

    //CREATE AN ACCOUNT AUTOMATICALLY IF USER DOESN'T EXIST
    if (!userData) {
      const newUser = new User({ chatId: id });
      await newUser.save();
      return newUser;
    }

    return userData;
  } catch (error) {
    handleError(ctx, error);
  }
};

module.exports = deposit = async (ctx, entryStatus) => {
  try {
    const userData = await createAccountIfNull(ctx);
    const { walletAddress } = userData;
    // console.log(walletAddress)
    if (walletAddress.trim() == "") {
      entryStatus.isSendingWalletAddress = true;
      return await ctx.reply(
        `Let's register your sender address before making deposits.\n\nSend me your sol wallet address, you shall use *only this address* to pay for your games.`,
        { parse_mode: "Markdown" }
      );
    }

    let replyText = `To deposit, send sol to this wallet address:\n\n\`${process.env.RECIEVING_ADDRESS}\` (Click to copy)

You need at least $5 worth of sol to start a game. Make sure you only send sol tokens or your funds will be lost⚠️

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
