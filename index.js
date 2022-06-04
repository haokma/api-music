const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

const accountRouter = require("./Routers/account");
const musicRouter = require("./Routers/music");
const favoriteRouter = require("./Routers/favorite");
const listMusicRouter = require("./Routers/list-music");
const playHistoryRouter = require("./Routers/play-history");
const searchRouter = require("./Routers/search");

dotenv.config();
const app = express();

mongoose.connect(process.env.MONGODB_URL, () => {
  console.log("Connected to MongoDB");
});

app.use(cors());
app.use(express.json());

app.use("/api/account", accountRouter);
app.use("/api/music", musicRouter);
app.use("/api/favorite", favoriteRouter);
app.use("/api/list-music", listMusicRouter);
app.use("/api/play-history", playHistoryRouter);
app.use("/api/search", searchRouter);

app.listen(process.env.PORT || 5000, () => {
  console.log("Server is running");
});
