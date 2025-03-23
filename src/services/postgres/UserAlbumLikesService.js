const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');

class UserAlbumLikesService {
  constructor(cacheService) {
    this._pool = new Pool();
    this._cacheService = cacheService;
  }

  async addAlbumLike({ userId, albumId }) {
    const id = `albumlike-${ nanoid(16) }`;

    // Cek apakah album ada
    await this.checkAlbumExistence(albumId);

    // Cek apakah album sudah disukai
    await this.checkAlbumLike(userId, albumId);

    const query = {
      text: 'INSERT INTO user_album_likes (id, user_id, album_id) VALUES($1, $2, $3) RETURNING id',
      values: [id, userId, albumId],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Gagal menyukai album');
    }

    await this._cacheService.delete(`albumLikes:${albumId}`);

    return result.rows[0].id;
  }

  async getAlbumLikes(albumId) {
    let headerValue;

    try {
      const result = await this._cacheService.get(`albumLikes:${albumId}`);
      headerValue = 'cache';
      return { likes: parseInt(result), headerValue };
    } catch {
      const query = {
        text: 'SELECT COUNT(album_id) FROM user_album_likes WHERE album_id = $1',
        values: [albumId],
      };

      const result = await this._pool.query(query);
      const likes = parseInt(result.rows[0].count);

      await this._cacheService.set(`albumLikes:${albumId}`, likes);
      headerValue = 'database';

      return { likes, headerValue };
    }
  }

  async deleteAlbumLike(userId, albumId) {
    const query = {
      text: 'DELETE FROM user_album_likes WHERE user_id = $1 AND album_id = $2 RETURNING id',
      values: [userId, albumId],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Tidak dapat membatalkan suka album. Id tidak ditemukan');
    }

    await this._cacheService.delete(`albumLikes:${albumId}`);
  }

  async checkAlbumExistence(albumId) {
    const query = {
      text: 'SELECT * FROM albums WHERE id = $1',
      values: [albumId],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Album tidak ditemukan');
    }
  }

  async checkAlbumLike(userId, albumId) {
    const query = {
      text: 'SELECT * FROM user_album_likes WHERE user_id = $1 AND album_id = $2',
      values: [userId, albumId],
    };

    const result = await this._pool.query(query);

    if (result.rows.length) {
      throw new InvariantError('Gagal menyukai album yang sama');
    }
  }
}

module.exports = UserAlbumLikesService;