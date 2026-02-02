import app from "./app.js";
import pool from "./config/db.js";

const PORT = process.env.PORT || 4000;

async function startServer() {
    try {
        await pool.query("SELECT 1");
        console.log("✅ MySQL connected");

        app.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("❌ Database connection failed:", error);
        process.exit(1);
    }
}

startServer();
