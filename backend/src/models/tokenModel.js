import pool from "../config/db.js";

const storeRefreshToken = async (userId, token) => {
    // Calculate expiration date (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await pool.query(
        "INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)",
        [userId, token, expiresAt]
    );
};

const findRefreshToken = async (token) => {
    const [rows] = await pool.query("SELECT * FROM refresh_tokens WHERE token_hash = ?", [token]);
    return rows[0];
};

const deleteRefreshToken = async (token) => {
    await pool.query("DELETE FROM refresh_tokens WHERE token_hash = ?", [token]);
};

const deleteAllUserRefreshTokens = async (userId) => {
    await pool.query("DELETE FROM refresh_tokens WHERE user_id = ?", [userId]);
};

export default { storeRefreshToken, findRefreshToken, deleteRefreshToken, deleteAllUserRefreshTokens };
