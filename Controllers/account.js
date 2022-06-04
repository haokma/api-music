const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const moment = require("moment");
const mongooseAccount = require("../Models/account");
const { createAccessToken } = require("../helpers/jwt_helpers");
const validateEmail = require("email-validator").validate;

const accountControllers = {
  REGISTER: async (req, res) => {
    try {
      const avatarDefault = [
        "https://res.cloudinary.com/phuockaito/image/upload/v1627194964/user/1_oupk48.png",
        "https://res.cloudinary.com/phuockaito/image/upload/v1627194964/user/2_dtmvm9.png",
        "https://res.cloudinary.com/phuockaito/image/upload/v1627194964/user/3_ttwqrr.png",
        "https://res.cloudinary.com/phuockaito/image/upload/v1627194964/user/4_fbupvc.png",
        "https://res.cloudinary.com/phuockaito/image/upload/v1627194964/user/5_c2r91d.png",
      ];
      const random = Math.floor(Math.random() * avatarDefault.length);
      const create = moment().format();
      const { userName, password, email } = req.body;
      if (!validateEmail(email))
        return res.status(400).json({ msg: "Invalid emails." });
      const doseExists = await mongooseAccount.findOne({ email: email });
      if (doseExists)
        return res.status(400).json({ message: "account exists" });
      if (!password)
        return res.status(400).json({ message: "Please enter password" });
      if (userName.length < 1 || userName.length > 30)
        return res
          .status(400)
          .json({ message: "Username should not exceed 30 characters" });
      if (password.length < 8)
        return res
          .status(400)
          .json({ message: "password must be at least 8 characters long" });
      const passwordHash = await bcrypt.hash(password.trim(), 12);
      const newAccount = new mongooseAccount({
        _id: new mongoose.Types.ObjectId(),
        user_name: userName.trim(),
        password: passwordHash,
        email: email.trim(),
        image: avatarDefault[random],
        createdAt: create,
        updatedAt: create,
      });
      const result = await newAccount.save();
      const user = {
        id: result._id,
        userName: result.user_name,
        email: result.email,
      };

      const accessToken = await createAccessToken(user);

      res.json({
        accessToken,
        data: result,
      });
    } catch (err) {
      res.json({
        status: "error",
        message: err,
      });
    }
  },
  LOGIN: async (req, res) => {
    try {
      const { email, password } = req.body;
      const account = await mongooseAccount.findOne({ email: email.trim() });
      if (!account)
        return res.status(400).json({ message: "Account does not exist" });
      const isMatch = await bcrypt.compare(password.trim(), account.password);
      if (!isMatch)
        return res.status(400).json({ message: "Incorrect password" });
      const user = {
        id: account._id,
        userName: account.user_name,
        email: account.email,
      };
      const accessToken = await createAccessToken(user);
      res.json({
        accessToken,
        data: account,
      });
    } catch (err) {
      res.json({
        status: "error",
        message: err,
      });
    }
  },
  LOGOUT: (req, res) => {
    res.clearCookie("Token");
    return res.redirect("/");
  },
  LIST_ACCOUNT: async (req, res) => {
    try {
      const search = req.query.search || "";
      const _page = req.query._page * 1 || 1;
      const _limit = req.query._limit * 1 || 20;
      const start = (_page - 1) * _limit;
      const end = start + _limit;
      const account = await mongooseAccount.find({
        user_name: { $regex: search, $options: "i" },
      });
      res.status(200).json({
        pagination: {
          _limit: _limit,
          _page: _page,
          _total: account.length,
        },
        data: account.slice(start, end),
      });
    } catch (error) {
      res.status(500).json({
        error: error.message,
      });
    }
  },
  PROFILE: async (req, res) => {
    try {
      const { id } = req;
      const account = await mongooseAccount.findById(id);
      if (!account)
        return res.status(400).json({ message: "no found account" });
      const user = {
        id: account._id,
        userName: account.user_name,
        email: account.email,
      };
      const accessToken = await createAccessToken(user);
      res.json({
        accessToken,
        data: account,
      });
    } catch (error) {
      res.json({
        status: "error",
        message: error,
      });
    }
  },
  ACTIVE_ACCOUNT: async (req, res) => {
    try {
      const _id = req.params._id;
      const account = await mongooseAccount.findById(_id);
      if (account.isActive) {
        account.isActive = false;
      } else {
        account.isActive = true;
      }
      account.save();
      res.json({
        data: account,
      });
    } catch (error) {
      res.json({
        status: "error",
        message: error,
      });
    }
  },
};

module.exports = accountControllers;
