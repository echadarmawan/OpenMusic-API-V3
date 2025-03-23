const Joi = require('joi');

const UserAlbumLikePayloadSchema = Joi.object({
  userId: Joi.string().required(),
  albumId: Joi.string().required(),
});

module.exports = { UserAlbumLikePayloadSchema };