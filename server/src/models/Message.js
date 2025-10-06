// server/src/models/Message.js
const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },// title field 
    text: { type: String, required: true }, // text field for recipee 
    imageUrl: {type: String }, // this allows optional images 
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", messageSchema);
