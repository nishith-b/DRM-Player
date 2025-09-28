const express = require("express");
const dotenv = require("dotenv");
const { connectDB } = require("./config/db");
const apiRoutes = require("./routes");
const cors = require("cors");
const cookieParser = require("cookie-parser");

dotenv.config();

connectDB();

const PORT = process.env.PORT;

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

app.use("/api", apiRoutes);

app.listen(PORT, () => {
  console.log(`Server started at port ${PORT}`);
});
