const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');

class SongsService {
  constructor() {
    this._pool = new Pool();
  }

  async addSong({ title, year, performer, genre, duration, albumId }) {
    const id = `song-${ nanoid(16) }`;

    const query = {
      text: 'INSERT INTO songs VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING id',
      values: [id, title, year, performer, genre, duration, albumId],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Lagu gagal ditambahkan');
    }

    return result.rows[0].id;
  }

  async getSongs({ title, performer }) {
    // Mulai dengan kueri dasar, dengan 1=1 untuk memastikan kueri selalu valid, bahkan jika tidak ada filter
    let query = 'SELECT id, title, performer FROM songs WHERE 1=1';
    const queryParams = [];

    // Filter berdasarkan judul lagu jika ada (pakai ILKIKE agar tidak case-sensitive)
    if (title) {
      query += ' AND title ILIKE $1';
      queryParams.push(`%${ title }%`);
    }

    // Filter berdasarkan performer jika ada
    if (performer) {
      query += ` AND performer ILIKE $${ queryParams.length + 1 }`;
      queryParams.push(`%${ performer }%`);
    }

    const result = await this._pool.query(query, queryParams);
    return result.rows;
  }

  async getSongById(id) {
    const query = {
      text: 'SELECT * FROM songs WHERE id = $1',
      values: [id],
    };
    // karena kita akan mengambil rows dan rowCount, maka gunakan destructuring object alih-alih membuat variabel result
    const { rows, rowCount } = await this._pool.query(query);

    // gunakan rowCount alih-alih result.rows.length
    if (!rowCount) {
      throw new NotFoundError('Lagu tidak ditemukan');
    }

    return rows[0];
  }

  async editSongById(id, { title, year, performer, genre, duration }) {
    const query = {
      text: 'UPDATE songs SET title = $1, year = $2, performer = $3, genre = $4, duration = $5 WHERE id = $6 RETURNING id',
      values: [title, year, performer, genre, duration, id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Gagal memperbarui lagu. Id tidak ditemukan');
    }
  }

  async deleteSongById(id) {
    const query = {
      text: 'DELETE FROM songs WHERE id = $1 RETURNING id',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Lagu gagal dihapus. Id tidak ditemukan');
    }
  }
}

module.exports = SongsService;
