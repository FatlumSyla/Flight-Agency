import pool from "./src/config/db.js";
import fs from "fs";

async function checkSchema() {
    try {
        console.log("--- USERS ---");
        const [users] = await pool.query("DESCRIBE users");
        console.table(users);

        console.log("\n--- REFRESH_TOKENS ---");
        const [tokens] = await pool.query("DESCRIBE refresh_tokens");
        console.table(tokens);

        console.log("\n--- BOOKINGS ---");
        console.log("\n--- BOOKINGS ---");
        const [bookings] = await pool.query("DESCRIBE bookings");
        fs.writeFileSync('schema.json', JSON.stringify(bookings, null, 2));
        console.log("Schema written to schema.json");

    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

checkSchema();
