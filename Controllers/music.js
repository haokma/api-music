const mongoose = require("mongoose");
const vnmToAlphabet = require("vnm-to-alphabet");
const moment = require("moment");
const cloudinary = require("cloudinary");
const Downloader = require("nodejs-file-downloader");
const axios = require("axios");
const glob = require("glob");
const mongooseMusic = require("../Models/music");
const mongooseAccount = require("../Models/account");
require("dotenv").config();

const {
  CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
  API_KEY,
  API_HOST,
} = process.env;

cloudinary.config({
  cloud_name: CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
});

class ApiFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }
  sorting() {
    this.query = this.query.sort("-createdAt");
    return this;
  }
}

const format = (seconds) => {
  const date = new Date(seconds * 1000);
  const hh = date.getUTCHours();
  const mm = date.getUTCMinutes();
  const ss = pad(date.getUTCSeconds());
  if (hh) {
    return `${hh}:${pad(mm)}:${ss}`;
  }
  return `${mm}:${ss}`;
};

const pad = (string) => ("0" + string).slice(-2);

function YouTubeGetID(url) {
  url = url.split(/(vi\/|v=|\/v\/|youtu\.be\/|\/embed\/)/);
  return url[2] !== undefined ? url[2].split(/[^0-9a-z_\-]/i)[0] : url[0];
}

function get_link_download(videoID) {
  const options = {
    method: "GET",
    url: "https://youtube-mp36.p.rapidapi.com/dl",
    params: { id: videoID },
    headers: {
      "X-RapidAPI-Host": API_HOST,
      "X-RapidAPI-Key": API_KEY,
    },
  };

  return new Promise(function (resolve) {
    const resp = axios.request(options);
    resolve(resp);
  });
}

function download(link_download) {
  const downloader = new Downloader({
    url: link_download,
    directory: "./downloads",
  });
  return downloader.download();
}

function get_data_upload(videoID) {
  return new Promise(function (resolve) {
    const data_thumbnail = cloudinary.v2.uploader.upload(
      `https://img.youtube.com/vi/${videoID}/0.jpg`,
      { folder: "thumbnail" },
      function (error, result) {
        return result;
      }
    );

    data_thumbnail.then(function (resp_data_thumbnail) {
      glob(`./downloads/*${videoID}.mp3`, {}, (err, files) => {
        const path = files[0];
        const data_music = cloudinary.v2.uploader.upload(
          path,
          { resource_type: "video", folder: "music" },
          function (error, result) {
            return result;
          }
        );

        data_music.then(function (resp_data_music) {
          var resp = {
            data_thumbnail: resp_data_thumbnail,
            data_music: resp_data_music,
          };
          resolve(resp);
        });
      });
    });
  });
}

const musicControllers = {
  CREATE_MUSIC: async (req, res) => {
    try {
      const create_music = moment().format();
      const { id } = req;
      // const account = await mongooseAccount.findById(id);
      // if (!account)
      //   return res.status(401).json({ messages: "account not found" });
      var { link_mv, name_singer, category } = req.body;
      name_singer = name_singer || "";
      category = category || "";
      const videoID = YouTubeGetID(link_mv);

      get_link_download(videoID).then(function (resp) {
        const link_download = resp.data.link;
        const title = resp.data.title;
        download(link_download).then(() => {
          get_data_upload(videoID).then(async function (resp_data_uploaded) {
            const data_thumbnail = resp_data_uploaded.data_thumbnail;
            const data_music = resp_data_uploaded.data_music;
            const time = format(data_music.duration);

            const new_music = new mongooseMusic({
              _id: new mongoose.Types.ObjectId(),
              id_account: id || "628d08b7626add9fba412c47",
              name_singer: name_singer,
              slug_name_singer: vnmToAlphabet(
                name_singer.trim().toLowerCase().replace(/ /g, "-")
              ),
              src_music: data_music.url,
              link_mv: `https://www.youtube.com/watch?v=${videoID}`,
              image_music: data_thumbnail.url,
              time_format: time,
              seconds: data_music.duration,
              name_music: title.trim(),
              slug_name_music: vnmToAlphabet(
                title.trim().toLowerCase().replace(/ /g, "-")
              ),
              category: category.trim(),
              slug_category: vnmToAlphabet(
                category.trim().toLowerCase().replace(/ /g, "-")
              ),
              view: Math.floor(Math.random() * 20000) + 1,
              favorite: Math.floor(Math.random() * 20000) + 1,
              subscribe: name_singer.trim(),
              slug_subscribe: vnmToAlphabet(
                name_singer.trim().toLowerCase().replace(/ /g, "-")
              ),
              createdAt: create_music,
              updatedAt: create_music,
            });

            const result = await new_music.save();
            res.json({
              data: result,
            });
          });
        });
      });
    } catch (error) {
      res.status(401).json({
        message: error,
      });
    }
  },
  EDIT_MUSIC: async (req, res) => {
    try {
      const { id } = req;
      const account = await mongooseAccount.findById(id);
      if (!account)
        return res.status(401).json({ messages: "account not found" });

      const _id = req.params._id;
      const music = await mongooseMusic.findById(_id);
      const imageMusicNew = req.files["image_music"];
      if (imageMusicNew) {
        const resultImageMusic = await cloudinary.v2.uploader.upload(
          imageMusicNew[0].path,
          { folder: "thumbnail" }
        );
        var image_music_new = resultImageMusic.url;
      }
      const { name_singer_new, name_music_new, category_new } = req.body;
      const updatedMusic = {
        ...music._doc,
        name_singer: name_singer_new || music.name_singer,
        name_music: name_music_new || music.name_music,
        category: category_new || music.category,
        image_music: image_music_new || music.image_music,
        slug_name_singer: vnmToAlphabet(
          (name_singer_new || music.name_singer)
            .trim()
            .toLowerCase()
            .replace(/ /g, "-")
        ),
        slug_name_music: vnmToAlphabet(
          (name_music_new || music.name_music)
            .trim()
            .toLowerCase()
            .replace(/ /g, "-")
        ),
        slug_category: vnmToAlphabet(
          (category_new || music.category)
            .trim()
            .toLowerCase()
            .replace(/ /g, "-")
        ),
      };
      console.log(`updatedMusic=${updatedMusic.name_singer}`);
      const resMusic = await mongooseMusic.findByIdAndUpdate(
        _id,
        updatedMusic,
        { new: true }
      );
      console.log(`resMusic = ${resMusic}`);
      res.json({
        data: resMusic,
      });
    } catch (error) {
      res.status(401).json({
        message: error,
      });
    }
  },
  GET_MUSIC_ACCOUNT: async (req, res) => {
    try {
      const _page = req.query._page * 1 || 1;
      const _limit = req.query._limit * 1 || 20;
      const start = (_page - 1) * _limit;
      const end = start + _limit;
      const { id } = req;
      const account = await mongooseAccount.findById(id);
      if (!account)
        return res.status(400).json({ message: "no found account" });
      const uploadLength = await mongooseMusic.find({ id_account: id });
      const features = new ApiFeatures(
        mongooseMusic.find({ id_account: id }),
        req.query
      ).sorting();
      const result = await features.query;
      res.json({
        pagination: {
          _limit: _limit,
          _page: _page,
          _total: uploadLength.length,
        },
        data: result.slice(start, end),
      });
    } catch (err) {
      console.log(err);
    }
  },
  GET_BY_ID: async (req, res) => {
    try {
      const { _id } = req.query;
      const music = await mongooseMusic.findById(_id);
      if (!music) return res.status(404).json({ message: "music not found" });
      const result = await mongooseMusic.findByIdAndUpdate(
        _id,
        { view: music.view + 1 },
        { new: true }
      );
      res.json({
        message: "success",
        data: result,
      });
    } catch (error) {
      res.json({
        message: error,
      });
    }
  },
  GET_NAME_SINGER: async (req, res) => {
    try {
      const { singer } = req.query;
      const _page = req.query._page * 1 || 1;
      const _limit = req.query._limit * 1 || 20;
      const start = (_page - 1) * _limit;
      const end = start + _limit;
      const length_music = await mongooseMusic.find();
      const features = new ApiFeatures(
        mongooseMusic.find({ slug_subscribe: singer }),
        req.query
      ).sorting();
      const result = await features.query;
      if (!result.length)
        return res.status(404).json({ message: "music not found" });
      res.json({
        pagination: {
          _limit: _limit,
          _page: _page,
          _total: length_music.length,
        },
        data: result.slice(start, end),
      });
    } catch (error) {
      res.json({
        message: error,
      });
    }
  },
  GET_CATEGORY: async (req, res) => {
    try {
      const { category } = req.query;
      const _page = req.query._page * 1 || 1;
      const _limit = req.query._limit * 1 || 20;
      const start = (_page - 1) * _limit;
      const end = start + _limit;
      const length_music = await mongooseMusic.find();
      const features = new ApiFeatures(
        mongooseMusic.find({ slug_category: category }),
        req.query
      ).sorting();

      const result = await features.query;
      if (!result.length)
        return res.status(404).json({ message: "music not found" });
      res.json({
        pagination: {
          _limit: _limit,
          _page: _page,
          _total: length_music.length,
        },
        data: result.slice(start, end),
      });
    } catch (error) {
      res.json({
        message: error,
      });
    }
  },
  GET_NAME_MUSIC: async (req, res) => {
    try {
      const { music } = req.query;
      const result = await mongooseMusic.findOne({ slug_name_music: music });
      if (!result) return res.status(404).json({ message: "music not found" });
      res.json({
        message: "success",
        data: result,
      });
    } catch (error) {
      res.json({
        message: error,
      });
    }
  },
  GET_ALL: async (req, res) => {
    try {
      const search = req.query.search || "";
      const _page = req.query._page * 1 || 1;
      const _limit = req.query._limit * 1 || 20;
      const start = (_page - 1) * _limit;
      const end = start + _limit;
      const length_music = await mongooseMusic.find({
        slug_name_music: { $regex: search, $options: "i" },
      });
      const features = new ApiFeatures(
        mongooseMusic.find({
          slug_name_music: { $regex: search, $options: "i" },
        }),
        req.query
      ).sorting();
      const result = await features.query;
      res.json({
        pagination: {
          _limit: _limit,
          _page: _page,
          _total: length_music.length,
        },
        data: result.slice(start, end),
      });
    } catch (error) {
      res.json({
        message: error,
      });
    }
  },
  TRENDING_MUSIC: async (req, res) => {
    try {
      const _page = req.query._page * 1 || 1;
      const _limit = req.query._limit * 1 || 20;
      const start = (_page - 1) * _limit;
      const end = start + _limit;
      const length_music = await mongooseMusic.find();
      const features = new ApiFeatures(
        mongooseMusic.find().sort({ view: -1 }),
        req.query
      );
      const result = await features.query;
      res.json({
        pagination: {
          _limit: _limit,
          _page: _page,
          _total: length_music.length,
        },
        data: result,
      });
    } catch (error) {
      res.json({
        message: error,
      });
    }
  },
  FAVORITE_MUSIC: async (req, res) => {
    try {
      const _page = req.query._page * 1 || 1;
      const _limit = req.query._limit * 1 || 20;
      const start = (_page - 1) * _limit;
      const end = start + _limit;
      const length_music = await mongooseMusic.find();
      const features = new ApiFeatures(
        mongooseMusic.find().sort({ favorite: -1 }),
        req.query
      );
      const result = await features.query;
      res.json({
        pagination: {
          _limit: _limit,
          _page: _page,
          _total: length_music.length,
        },
        data: result.slice(start, end),
      });
    } catch (error) {
      res.json({
        message: error,
      });
    }
  },
  DELETE_BY_ID: async (req, res) => {
    try {
      const { _id } = req.query;
      const music = await mongooseMusic.findByIdAndDelete(_id);
      if (!music) return res.status(404).json({ message: "music not found" });
      res.json({
        _id,
      });
    } catch (error) {
      res.json({
        message: error,
      });
    }
  },
};

module.exports = musicControllers;
