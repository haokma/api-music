const mongoose = require("mongoose");

const musicSchema = new mongoose.Schema(
  {
    id_account: { type: String, default: "628d087c626add9fba412c3e" },
    name_singer: { type: String, default: "unknown" },
    slug_name_singer: { type: String, default: "unknown" },
    src_music: { type: String, default: "unknown" },
    link_mv: { type: String, default: "unknown" },
    image_music: { type: String, default: "unknown" },
    time_format: { type: String, default: "unknown" },
    seconds: { type: Number, default: 0 },
    name_music: { type: String, default: "unknown" },
    slug_name_music: { type: String, default: "unknown" },
    category: { type: String, default: "unknown" },
    slug_category: { type: String, default: "unknown" },
    sum_comment: { type: Number, default: 0 },
    view: { type: Number, default: null },
    subscribe: { type: String, default: "unknown" },
    slug_subscribe: { type: String, default: "unknown" },
    favorite: { type: Number, default: null },
    account_favorite: { type: Array, default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Music", musicSchema);
