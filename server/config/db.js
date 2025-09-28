const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

const mongourl = process.env.MONGO_URL;

function connectDB() {
  mongoose.connect(mongourl);
  console.log("Connected to DB✅");
}

module.exports = {
  connectDB,
};
