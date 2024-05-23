const { model, Schema } = require("mongoose");

const signatureSchema = new Schema(
  {
    signature:String,
  },
  { timestamps: true }
);

const Signature = model("Signature", signatureSchema);
module.exports = Signature;
