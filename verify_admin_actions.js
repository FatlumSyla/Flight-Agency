import pool from "./src/config/db.js";
import { hash } from "bcrypt";

const BASE_URL = "http://localhost:3000/api";

async function main() {
    console.log("Starting Admin Verification...");

    // 1. Setup Admin User
    const email = "admin_tester@example.com";
    const password = "admin123";
    let token = "";

    try {
        // Cleanup previous run
        await pool.query("DELETE FROM users WHERE email = ?", [email]);

        // Create user manually to ensure we have one, then update to admin
        const hashedPassword = await hash(password, 10);
        const [userResult] = await pool.query(
            "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)",
            ["Admin Tester", email, hashedPassword, "admin"]
        );
        console.log("Admin user created/reset.");

        // Login to get token
        const loginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        if (!loginRes.ok) throw new Error(`Login failed: ${loginRes.statusText}`);

        const loginData = await loginRes.json();
        token = loginData.accessToken;
        console.log("Logged in as admin. Token received.");

    } catch (err) {
        console.error("Setup failed:", err);
        process.exit(1);
    }

    let flightId = null;

    // 2. Test Create Flight
    try {
        console.log("\nTesting Create Flight...");
        const res = await fetch(`${BASE_URL}/flights`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                flight_number: "TEST999",
                origin: "JFK",
                destination: "LHR",
                depart_time: "2026-12-01 10:00:00",
                arrive_time: "2026-12-01 18:00:00",
                capacity: 100,
                price: 500
            })
        });

        const data = await res.json();
        if (res.ok) {
            console.log("SUCCESS: Flight created.", data);
            flightId = data.flightId;
        } else {
            console.error("FAILURE: Create flight failed.", data);
        }
    } catch (err) {
        console.error("Create flight error:", err);
    }

    if (!flightId) process.exit(1);

    // 3. Test Update Flight (Valid)
    try {
        console.log("\nTesting Valid Update...");
        const res = await fetch(`${BASE_URL}/flights/${flightId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                flight_number: "TEST999-UPDATED",
                origin: "JFK",
                destination: "LHR",
                depart_time: "2026-12-01 12:00:00",
                arrive_time: "2026-12-01 20:00:00",
                capacity: 120, // Increasing capacity
                price: 550
            })
        });
        const data = await res.json();
        if (res.ok) console.log("SUCCESS: Flight updated.");
        else console.error("FAILURE: Flight update failed.", data);
    } catch (err) { console.error(err); }

    // 4. Test Invalid Update (Capacity < Booked)
    // First, simulate a booking by artificially reducing available seats in DB
    try {
        console.log("\nTesting Invalid Update (Capacity Check)...");
        // Simulate 50 seats booked (120 capacity - 70 available = 50 booked)
        await pool.query("UPDATE flights SET available_seats = 70 WHERE id = ?", [flightId]);

        // Try to set capacity to 40 (less than 50 booked)
        const res = await fetch(`${BASE_URL}/flights/${flightId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                flight_number: "TEST999-UPDATED",
                origin: "JFK",
                destination: "LHR",
                depart_time: "2026-12-01 12:00:00",
                arrive_time: "2026-12-01 20:00:00",
                capacity: 40,
                price: 550
            })
        });
        const data = await res.json();
        if (res.status === 400 && data.message.includes("bookings")) {
            console.log("SUCCESS: Blocked invalid capacity update.", data.message);
        } else {
            console.error("FAILURE: Should have blocked update.", res.status, data);
        }
    } catch (err) { console.error(err); }

    // 5. Test Delete Flight (Blocked by bookings)
    try {
        console.log("\nTesting Delete (Blocked by bookings)...");
        // We still have 50 booked seats from previous step
        const res = await fetch(`${BASE_URL}/flights/${flightId}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.status === 400 && data.message.includes("active bookings")) {
            console.log("SUCCESS: Blocked delete with bookings.", data.message);
        } else {
            console.error("FAILURE: Should have blocked delete.", res.status, data);
        }
    } catch (err) { console.error(err); }

    // 6. Test Delete Flight (Success)
    try {
        console.log("\nTesting Valid Delete...");
        // Reset available seats to capacity (120) -> 0 booked
        await pool.query("UPDATE flights SET available_seats = 120 WHERE id = ?", [flightId]);

        const res = await fetch(`${BASE_URL}/flights/${flightId}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
            console.log("SUCCESS: Flight deleted.");
        } else {
            console.error("FAILURE: Delete failed.", data);
        }
    } catch (err) { console.error(err); }

    // Cleanup User
    await pool.query("DELETE FROM users WHERE email = ?", [email]);
    console.log("\nCleanup done.");
    process.exit(0);
}

main();
