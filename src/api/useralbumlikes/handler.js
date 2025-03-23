const autoBind = require('auto-bind');

class UserAlbumLikesHandler {
  constructor(service, validator) {
    this._service = service;
    this._validator = validator;

    autoBind(this);
  }

  async postUserAlbumLikeHandler(request, h) {
    const { id: userId } = request.auth.credentials;
    const { id: albumId } = request.params;

    await this._service.addAlbumLike({ userId, albumId });

    const response = h.response({
      status: 'success',
      message: 'Menyukai album',
    });
    response.code(201);
    return response;
  }

  async getUserAlbumLikesHandler(request, h) {
    const { id: albumId } = request.params;

    const { likes, headerValue } = await this._service.getAlbumLikes(albumId);

    const response = h.response({
      status: 'success',
      data: {
        likes,
      },
    });
    response.header('X-Data-Source', headerValue);
    return response;
  }

  async deleteUserAlbumLikeHandler(request) {
    const { id: userId } = request.auth.credentials;
    const { id: albumId } = request.params;

    await this._service.deleteAlbumLike(userId, albumId);

    return {
      status: 'success',
      message: 'Batal menyukai album',
    };
  }
}

module.exports = UserAlbumLikesHandler;