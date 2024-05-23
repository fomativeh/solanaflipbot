const User = require("../models/userModel");
const handleError = require("./handleError");

module.exports = createUserAccount = async (ctx) => {
  try {
    const { id } = ctx.from;
    const newUser = new User({
      chatId: id,
    });

    await newUser.save();
  } catch (error) {
    handleError(ctx, error);
  }
};
