import pool from "./src/config/db.js";

async function checkCols() {
    try {
        console.log("--- USERS COLUMNS ---");
        const [uCols] = await pool.query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'flight_agency' AND TABLE_NAME = 'users'");
        console.log(uCols.map(c => c.COLUMN_NAME));

        console.log("--- REFRESH_TOKENS COLUMNS ---");
        const [tCols] = await pool.query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'flight_agency' AND TABLE_NAME = 'refresh_tokens'");
        console.log(tCols.map(c => c.COLUMN_NAME));

    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

checkCols();
