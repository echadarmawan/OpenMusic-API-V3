const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');

class PlaylistSongsService {
  constructor() {
    this._pool = new Pool();
  }

  async addPlaylistSong({ playlistId, songId }) {
    const id = `playlistsong-${ nanoid(16) }`;

    const query = {
      text: 'INSERT INTO playlist_songs VALUES($1, $2, $3) RETURNING id',
      values: [id, playlistId, songId],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Lagu gagal ditambahkan ke playlist');
    }

    return result.rows[0].id;
  }

  async getPlaylistSongs(playlistId) {
    const query = {
      text: `SELECT p.id, p.name, u.username,
      s.id AS song_id, s.title AS song_title, s.performer AS song_performer FROM playlists p
      JOIN users u ON p.owner = u.id
      JOIN playlist_songs ps ON p.id = ps.playlist_id
      JOIN songs s ON ps.song_id = s.id
      WHERE p.id = $1`,
      values: [playlistId],
    };
    const result = await this._pool.query(query);

    // JIka tidak ada playlist, kembalikan kosong
    if (result.rows.length === 0) {
      return [];
    }

    // Mengelompokkan data berdasarkan playlist
    const playlist = {
      id: result.rows[0].id,
      name: result.rows[0].name,
      username: result.rows[0].username,
      songs: result.rows.map((row) => ({
        id: row.song_id,
        title: row.song_title,
        performer: row.song_performer,
      })),
    };

    return playlist;
  }

  async deletePlaylistSong(playlistId, songId) {
    const query = {
      text: 'DELETE FROM playlist_songs WHERE playlist_id = $1 AND song_id = $2 RETURNING id',
      values: [playlistId, songId],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Lagu gagal dihapus dari playlist. Id tidak ditemukan');
    }
  }

  async verifySongById(songId) {
    const query = {
      text: 'SELECT * FROM songs WHERE id = $1',
      values: [songId],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Lagu tidak ditemukan');
    }
  }

  async addPlaylistSongActivity(playlistId, songId, userId, action) {
    const id = `activity-${ nanoid(16) }`;

    const query = {
      text: 'INSERT INTO ps_activities VALUES($1, $2, $3, $4, $5) RETURNING id',
      values: [id, playlistId, songId, userId, action],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Aktivitas playlist gagal ditambahkan');
    }

    return result.rows[0].id;
  }

  async getPlaylistActivities(playlistId) {
    const query = {
      text: `SELECT u.username, s.title, a.action, a.time FROM ps_activities a
      JOIN playlists p ON a.playlist_id = p.id
      JOIN songs s ON a.song_id = s.id
      JOIN users u ON p.owner = u.id
      WHERE a.playlist_id = $1
      ORDER BY a.time ASC`,
      values: [playlistId],
    };

    const result = await this._pool.query(query);

    return result.rows.map((row) => ({
      username: row.username,
      title: row.title,
      action: row.action,
      time: row.time,
    }));
  }
}

module.exports = PlaylistSongsService;