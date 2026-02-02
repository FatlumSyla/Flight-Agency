import pool from "../config/db.js";

const findByEmail = async (email) => {
    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    return rows[0];
};

const findById = async (id) => {
    const [rows] = await pool.query("SELECT id, name, email, role FROM users WHERE id = ?", [id]);
    return rows[0];
};

const create = async (name, email, passwordHash, role = "user") => {
    const [result] = await pool.query(
        "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)",
        [name, email, passwordHash, role]
    );
    return result.insertId;
};

export default { findByEmail, findById, create };
