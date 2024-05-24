const User = require("../models/userModel");
const flipCoin = require("./flipCoin");
const handleError = require("./handleError");

module.exports = handleStartGame = async (ctx) => {
  try {
    const { id } = ctx.from;
    const userData = await User.findOne({ chatId: id });
    if (!userData) return;
    const { balance } = userData;
   const updatedBalance = parseFloat((balance - 5).toFixed(2)) //DEDUCT $5 STAKE
    userData.balance  = updatedBalance
    userData.currentGame = { heads: 0 };
    await userData.save();

    //FLIP COIN
    const msg1 = await ctx.reply("Game Started 🎮");
    const msg2 = await ctx.reply("Flipping coin 🪙🪙🪙");
    const flipResult = flipCoin();

    if (flipResult == "TAIL") {
      //UPDATE USER ACCOUNT AND DEDUCT BALANCE IF THEY LOSE
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
      return setTimeout(async()=>{
        await ctx.deleteMessage(msg1.message_id);
        await ctx.deleteMessage(msg2.message_id);
      }, 1200)
    }

    //HANDLE WIN CASE
    userData.currentGame = { heads: 1 };
    const newBalance = parseFloat((balance + 9).toFixed(2));
    userData.balance = newBalance
    await userData.save();

    await ctx.reply(`FLIP RESULT: HEAD ✅\nYou win $9😎\nNew Balance: $${newBalance}`, {
      reply_markup: {
        inline_keyboard: [
          [{ text: "Flip Again 🪙", callback_data: "continue-playing" }],
          [{ text: "End Game ❌", callback_data: "end-game" }],
        ],
      },
    });

   return setTimeout(async()=>{
      await ctx.deleteMessage(msg1.message_id);
      await ctx.deleteMessage(msg2.message_id);
    }, 1200)
  } catch (error) {
    await handleError(ctx, error);
  }
};
