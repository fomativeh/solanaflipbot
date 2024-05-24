const User = require("../models/userModel")
const handleError = require("./handleError")

module.exports = handleEndGame = async (ctx)=>{
    try {
        const userData = await User.findOne({chatId:ctx.from.id})
        userData.currentGame = {}
        await userData.save()
        await ctx.reply("Game Ended ✨"); // Edit the message text
        // await ctx.editMessageReplyMarkup({ inline_keyboard: [] }); // Remove the inline keyboard
    } catch (error) {
        handleError(ctx, error)
    }
}