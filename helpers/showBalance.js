const User = require("../models/userModel");
const handleError = require("./handleError");

module.exports = showBalance = async (ctx) => {
  try {
    const { id } = ctx.from;
    const userExists = await User.findOne({ chatId: id });
    let balance;

    //CREATE AN ACCOUNT AUTOMATICALLY IF USER DOESN'T EXIST
    if (!userExists) {
      const newUser = new User({ chatId: id });
      await newUser.save();
      balance = 0;
    } else {
      balance = userExists.balance;
    }

    const replyText = `Your account balance is *$${balance.toFixed(2)}*`;
    const replyMarkup = {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "Deposit Sol 💳 🪙",
              callback_data: "deposit",
            },
            {
              text: "Withdraw 🤑",
              callback_data: "withdraw",
            },
          ],
        ],
      },
    };
    ctx.reply(replyText, { ...replyMarkup, parse_mode: "Markdown" });
  } catch (error) {
    handleError(ctx, error)
  }
};
