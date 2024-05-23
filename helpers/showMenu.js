const queue = require("..");
const User = require("../models/userModel");
const handleError = require("./handleError");

module.exports = showMenu = async (ctx, userExists) => {
  try {
    const row1 = [
      {
        text: "New Game ✅",
        callback_data: "new_game",
      },
    ];

    const row2 = [
      {
        text: "Deposit Sol 💳 🪙",
        callback_data: "deposit",
      },
    ];

    //SHOW BALANCE AND WITHDRAW BUTTONS TO EXISTING USERS
    if (userExists) {
      row1.push({
        text: "My Balance 💰 💵",
        callback_data: "balance",
      });

      row2.push({
        text: "Withdraw 🤑",
        callback_data: "withdraw",
      });
    }

    const replyMarkup = {
      reply_markup: {
        inline_keyboard: [row1, row2],
      },
    };

    let replyText;
    if (userExists) {
      replyText = `Welcome back, @${ctx.from.username}\nPick an option below:`;
    } else {
      replyText = `Welcome to Solana FlipBot.\nPick an option below:`;
      //Create an account for new user
      const newUser = new User({
        chatId: ctx.from.id,
        balance: 0,
      });
      await newUser.save();
    }

    await ctx.reply(replyText, {
      ...replyMarkup,
    });
  } catch (error) {
    handleError(ctx, error)
  }
};
