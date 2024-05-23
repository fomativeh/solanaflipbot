const { model, Schema } = require("mongoose");

const userSchema = new Schema(
  {
    walletAddress: { type: String, default: "" },
    balance: { type: Number, default: 0 },
    chatId: String,
    currentGame: {},
  },
  { timestamps: true }
);

const User = model("User", userSchema);
module.exports = User;

// currentGame : {
//   heads: Number,
// },