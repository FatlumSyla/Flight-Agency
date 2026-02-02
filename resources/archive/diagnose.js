import pool from './src/config/db.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

async function diagnose() {
    console.log("--- Starting Diagnostics ---");

    // 1. Check Env
    console.log("1. Environment Variables:");
    console.log("- PORT:", process.env.PORT);
    console.log("- DB_HOST:", process.env.DB_HOST);
    console.log("- JWT_SECRET:", process.env.JWT_SECRET ? "DEFINED" : "MISSING");
    console.log("- JWT_REFRESH_SECRET:", process.env.JWT_REFRESH_SECRET ? "DEFINED" : "MISSING");

    // 2. Check DB Connection
    try {
        await pool.query("SELECT 1");
        console.log("2. Database Connection: OK");
    } catch (err) {
        console.error("2. Database Connection: FAILED", err.message);
        return;
    }

    // 3. Check Users Table
    try {
        const [rows] = await pool.query("DESC users");
        const fields = rows.map(r => r.Field);
        console.log("3. Users Table Columns:", fields.join(", "));

        const required = ['id', 'name', 'email', 'password_hash'];
        const missing = required.filter(f => !fields.includes(f));
        if (missing.length > 0) {
            console.error("!!! MISSING REQUIRED COLUMNS:", missing);
        }

        if (!fields.includes('role')) {
            console.warn("??? 'role' column is missing. Registration logic might fail if it tries to insert 'role'.");
        }
    } catch (err) {
        console.error("3. Users Table Check: FAILED", err.message);
    }

    // 4. Try JWT Sign (Simulate Login Logic)
    try {
        const token = jwt.sign({ id: 1, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1m' });
        console.log("4. JWT Sign Test: OK");
    } catch (err) {
        console.error("4. JWT Sign Test: FAILED", err.message);
    }

    process.exit();
}

diagnose();
