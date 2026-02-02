


import fs from 'fs';

const BASE_URL = 'http://localhost:4000/api';
// Helper to pause
const sleep = (ms) => new Promise(res => setTimeout(res, ms));

async function runTests() {
    console.log("=== Starting Booking System Verification ===");

    // 1. Authenticate (Register a new user)
    const email = `testuser_${Date.now()}@example.com`;
    const password = 'password123';

    console.log(`\n> Registering user ${email}...`);
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Booking Tester', email, password })
    });

    if (regRes.status !== 201) {
        console.error("Registration failed", await regRes.json());
        return;
    }
    console.log("User registered.");

    // Login to get token
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    const { accessToken } = await loginRes.json();
    const headers = {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
    };

    // 2. Create a new flight (Assuming accessible or we use existing)
    // We try to create a flight with limited availability (e.g., 5 seats)
    // Check flight routes... if protected, we might fail here if not admin.
    // For now assuming we can create or there's a seed.
    // Actually, flight routes might need admin. Let's try.

    const flightNumber = `FL${Math.floor(Math.random() * 1000)}`;
    console.log(`\n> Creating flight ${flightNumber} with 5 seats...`);
    const flightRes = await fetch(`${BASE_URL}/flights`, {
        method: 'POST',
        // headers: headers, // use headers if protected, otherwise public
        // Based on typical setup, might be public or protected. I'll include token just in case.
        headers: headers,
        body: JSON.stringify({
            flight_number: flightNumber,
            origin: "NYC",
            destination: "LON",
            depart_time: "2026-06-01 10:00:00",
            arrive_time: "2026-06-01 18:00:00",
            capacity: 5,
            price: 500
        })
    });

    let flightId;
    let creationError = null;
    if (flightRes.status === 201) {
        const data = await flightRes.json();
        flightId = data.flightId;
        console.log(`Flight created (ID: ${flightId})`);
    } else {
        creationError = await flightRes.json();
        console.log("Could not create flight", creationError);
        // If we can't create a flight, we can't proceed well but let's try assuming ID 1 exists
        if (!flightId) flightId = 1;
    }

    // 3. Test Booking (Success)
    console.log("\n> Testing Single Booking (1 seat)...");
    const bookRes = await fetch(`${BASE_URL}/bookings`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ flightId, seats: 1 })
    });
    const bookData = await bookRes.json();
    console.log(`Status: ${bookRes.status}`, bookData);
    const bookingId = bookData.bookingId;
    const bookingError = bookRes.status !== 201 ? bookData : null;

    // 4. Test Concurrency (Overbooking)
    // Remaining seats: 4. We will try to book 2 seats, 3 times in parallel. (Total 6 requested, only 4 available)
    console.log("\n> Testing Overbooking (Concurrency)...");

    const promises = [1, 2, 3].map(i => {
        return fetch(`${BASE_URL}/bookings`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ flightId, seats: 2 })
        }).then(async r => ({ status: r.status, data: await r.json(), id: i }));
    });

    const results = await Promise.all(promises);

    let successCount = 0;
    let failCount = 0;
    const errors = [];
    results.forEach(r => {
        if (r.status === 201) successCount++;
        else {
            failCount++;
            errors.push(r.data);
        }
        console.log(`Request ${r.id}: Status ${r.status} - ${r.data.message}`);
    });

    console.log(`Summary: ${successCount} succeeded, ${failCount} failed.`);
    if (successCount === 2 && failCount === 1) { // 2 requests * 2 seats = 4 seats. 3rd request fails.
        console.log("SUCCESS: Overbooking prevented correctly.");
    } else {
        console.log("WARNING: Unexpected overbooking result.");
    }

    // 5. Test Cancellation
    if (bookingId) {
        console.log(`\n> Cancelling booking ${bookingId}...`);
        const cancelRes = await fetch(`${BASE_URL}/bookings/${bookingId}/cancel`, {
            method: 'POST',
            headers
        });
        console.log(`Status: ${cancelRes.status}`, await cancelRes.json());
    }

    // 6. Get User Bookings
    console.log("\n> Fetching User Bookings...");
    const getRes = await fetch(`${BASE_URL}/bookings`, { headers });
    const bookings = await getRes.json();
    console.log(`Found ${bookings.length} bookings.`);
    // console.table(bookings);

    const report = {
        flightId,
        creationError,
        bookingError,
        bookings,
        overbookingTest: { successCount, failCount, errors },
        cancellationTest: bookingId ? 'Attempted' : 'Skipped'
    };
    fs.writeFileSync('test_results.json', JSON.stringify(report, null, 2));

    console.log("\n=== Test Complete ===");
}

runTests();
