module.exports = handleError = async (ctx, error) => {
  console.log(error);
  if (ctx) {
    await ctx.reply("An error occured, please try again");
  }
};
