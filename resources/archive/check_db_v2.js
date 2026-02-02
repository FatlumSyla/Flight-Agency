import pool from "./src/config/db.js";

async function checkSchema() {
    try {
        console.log("Checking USERS...");
        const [users] = await pool.query("DESCRIBE users");
        console.log(JSON.stringify(users, null, 2));

        console.log("Checking REFRESH_TOKENS...");
        const [tokens] = await pool.query("DESCRIBE refresh_tokens");
        console.log(JSON.stringify(tokens, null, 2));

    } catch (err) {
        console.error("Error:", err);
    } finally {
        process.exit();
    }
}

checkSchema();
