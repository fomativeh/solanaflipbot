const User = require("../models/userModel");
const handleError = require("./handleError");

module.exports = newGame = async (ctx) => {
  try {
    const userData = await User.findOne({ chatId: ctx.from.id });
    const { balance } = userData;
    if (balance < 5) {
      return ctx.reply(
        `You need at least *$5* to start a game.\nYour current balance is *$${balance}*\nDeposit more sol to continue.`,

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

    const replyText = `
You're staking $5 for this game. 
`;

    const replyMarkup = {
      reply_markup: {
        inline_keyboard: [
          [
            { text: "Cancel ❌", callback_data: "cancel-initial" },
            { text: "Start Game ✅", callback_data: "start-game" },
          ],
        ],
      },
    };

    ctx.reply(replyText, { ...replyMarkup });
  } catch (error) {
    handleError(ctx, error);
  }
};
