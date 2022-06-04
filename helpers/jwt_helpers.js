const JWT = require("jsonwebtoken");
const createError = require("http-errors");

module.exports = {
  createAccessToken: (user) => {
    return new Promise((resolve, reject) => {
      JWT.sign(
        user,
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "30d" },
        (err, accessToken) => {
          if (err) reject(createError.InternalServerError());
          resolve(accessToken);
        }
      );
    });
  },
  authorizationToken: (req, res, next) => {
    try {
      if (!req.headers["authorization"])
        return next(createError.Unauthorized());
      const authHeader = req.headers["authorization"];
      const bearerToken = authHeader.split(" ");
      const token = bearerToken[1];
      console.log(token);
      JWT.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          const message =
            err.name === "JsonWebTokenError" ? "Unauthorized" : err.message;
          return next(createError.Unauthorized(message));
        }
        req.id = decoded.id;
        next();
      });
    } catch (error) {
      next(createError.Unauthorized());
    }
  },
};
