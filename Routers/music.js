const router = require("express").Router();
const upload = require('../multer');
const musicControllers = require("../Controllers/music");
const { authorizationToken } = require('../helpers/jwt_helpers');

router.post("/create", musicControllers.CREATE_MUSIC);
router.put("/edit/:_id", upload.fields([{ name: 'image_music', maxCount: 1 }]), authorizationToken, musicControllers.EDIT_MUSIC)
router.get('/get-by-id', musicControllers.GET_BY_ID);
router.get('/get-name-singer', musicControllers.GET_NAME_SINGER);
router.get('/get-name-music', musicControllers.GET_NAME_MUSIC);
router.get('/get-category', musicControllers.GET_CATEGORY);
router.get('/get-all', musicControllers.GET_ALL);
router.get('/trending', musicControllers.TRENDING_MUSIC);
router.get('/favorite', musicControllers.FAVORITE_MUSIC);
router.get('/get-upload', authorizationToken, musicControllers.GET_MUSIC_ACCOUNT);
router.delete('/delete-by-id', musicControllers.DELETE_BY_ID);

module.exports = router;
