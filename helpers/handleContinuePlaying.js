const User = require("../models/userModel");
const flipCoin = require("./flipCoin");
const handleError = require("./handleError");

module.exports = handleContinuePlaying = async (ctx) => {
  try {
    const { id } = ctx.from;
    const userData = await User.findOne({ chatId: id });
    if (!userData) return;
    const { balance } = userData;

    if (balance < 5) {
      return ctx.reply(
        `You need at least *$5* to keep playing.\nYour current balance is *$${balance}*\nDeposit more sol to continue.`,

        {
          reply_markup: {
            inline_keyboard: [
              [{ text: "Deposit Sol 💳 🪙", callback_data: "deposit" }],
            ],
          },
          parse_mode: "Markdown",
        }
      );
    }

    const updatedBalance = parseFloat((balance - 5).toFixed(2));
    userData.balance = updatedBalance; //DEDUCT $5 STAKE
    await userData.save();

    //FLIP COIN
    const msg1 = await ctx.reply("Game Started 🎮");
    const msg2 = await ctx.reply("Flipping coin 🪙🪙🪙");
    const flipResult = flipCoin();

    if (flipResult == "TAIL") {
      //UPDATE USER ACCOUNT WHEN THEY LOSE
      userData.currentGame = {};
      await userData.save();
      const replyMarkup = {
        reply_markup: {
          inline_keyboard: [
            [{ text: "Try again 🎮", callback_data: "new_game" }],
          ],
        },
      };

      await ctx.reply(
        `FLIP RESULT: TAIL ❌\nYou lose $5☹️\nNew Balance: *$${updatedBalance}*\nGame Ended`,
        { ...replyMarkup, parse_mode: "Markdown" }
      );

      return setTimeout(async () => {
        await ctx.deleteMessage(msg1.message_id);
        await ctx.deleteMessage(msg2.message_id);
      }, 1200);
    }

    //HANDLE WIN CASE
    const lastHeadCount = userData.currentGame.heads;
    //HANDLE 10 ROW JACKPOT
    if (lastHeadCount == 9) {
      userData.currentGame = {};
      const newBalance = parseFloat((updatedBalance + 1000).toFixed(2));
      userData.balance = newBalance;
      await userData.save();

      await ctx.reply(
        `FLIP RESULT: HEAD ✅\n10 in a row🎖️You win $1,000 Jackpot😎\nNew Balance: $${newBalance}\nGame Ended✨`
      );
      return setTimeout(async () => {
        await ctx.deleteMessage(msg1.message_id);
        await ctx.deleteMessage(msg2.message_id);
      }, 1200);
    }

    //HANDLE NORMAL HEAD WIN
    userData.currentGame = { heads: lastHeadCount + 1 };
    const newBalance = parseFloat((updatedBalance + 9).toFixed(2));
    userData.balance = newBalance;
    await userData.save();

    await ctx.reply(
      `FLIP RESULT: HEAD ✅\nYou win $9😎\nNew Balance: $${newBalance}`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "Flip Again 🪙", callback_data: "continue-playing" }],
            [{ text: "End Game ❌", callback_data: "end-game" }],
          ],
        },
      }
    );
    return setTimeout(async () => {
      await ctx.deleteMessage(msg1.message_id);
      await ctx.deleteMessage(msg2.message_id);
    }, 1200);
  } catch (error) {
    handleError(ctx, error);
  }
};
