/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.up = (pgm) => {
  // membuat user baru.
  pgm.sql("INSERT INTO users(id, username, password, fullname) VALUES ('old_user', 'old_user', 'old_user', 'old user')");

  // mengubah nilai owner pada playlist yang owner-nya bernilai NULL
  pgm.sql("UPDATE playlists SET owner = 'old_user' WHERE owner = NULL");

  // memberikan constraint foreign key pada owner terhadap kolom id dari tabel users
  pgm.addConstraint('playlists', 'fk_playlists_owner', {
    foreignKeys: {
      columns: 'owner',
      references: 'users(id)',
      onDelete: 'CASCADE'
    }
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  // menghapus constraint fk_playlists_owner pada tabel playlists
  pgm.dropConstraint('playlists', 'fk_playlists_owner');

  // mengubah nilai owner old_playlists pada playlist menjadi NULL
  pgm.sql("UPDATE playlists SET owner = NULL WHERE owner = 'old_user'");

  // menghapus user baru.
  pgm.sql("DELETE FROM users WHERE id = 'old_user'");
};
