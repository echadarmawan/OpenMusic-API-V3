const InvariantError = require('../../exceptions/InvariantError');
const { UserAlbumLikePayloadSchema } = require('./schema');

const UserAlbumLikesValidator = {
  validateUserAlbumLikePayload: (payload) => {
    const validationResult = UserAlbumLikePayloadSchema.validate(payload);
    if (validationResult.error) {
      throw new InvariantError(validationResult.error.message);
    }
  },
};

module.exports = UserAlbumLikesValidator;