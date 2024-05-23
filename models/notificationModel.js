const { model, Schema } = require("mongoose");

const notificationSchema = new Schema(
  {
    message: String,
    chatId: Number,
  },
  { timestamps: true }
);

const Notification = model("Notification", notificationSchema);
module.exports = Notification
