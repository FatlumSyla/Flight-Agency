import pool from "./src/config/db.js";

async function check() {
    try {
        const [rows] = await pool.query("SHOW COLUMNS FROM refresh_tokens");
        console.log("COLUMNS IN refresh_tokens:");
        rows.forEach(r => console.log(r.Field));
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
check();
