

const BASE_URL = 'http://localhost:4000/api/auth';

async function verifyAuth() {
    console.log("Starting Verification...");

    // 1. Register
    const email = `testuser_${Date.now()}@example.com`;
    const password = 'password123';

    console.log(`\n1. Registering user (${email})...`);
    const registerRes = await fetch(`${BASE_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Test User', email, password })
    });
    const registerData = await registerRes.json();
    console.log(`Status: ${registerRes.status}`, registerData);

    if (registerRes.status !== 201) return;

    // 2. Login
    console.log("\n2. Logging in...");
    const loginRes = await fetch(`${BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    const loginData = await loginRes.json();
    console.log(`Status: ${loginRes.status}`);

    if (loginRes.status !== 200) return;

    const { accessToken, refreshToken } = loginData;
    console.log("Tokens received.");

    // 3. Access Protected Route (Simulated by checking token validity via a mock endpoint or we can try to refresh)
    // Since we don't have a dedicated "me" endpoint yet, let's just assume if we got tokens it's good, 
    // but better: let's try to refresh the token which proves the refresh token is valid.

    console.log("\n3. Refreshing token...");
    const refreshRes = await fetch(`${BASE_URL}/refresh-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: refreshToken })
    });
    const refreshData = await refreshRes.json();
    console.log(`Status: ${refreshRes.status}`);
    if (refreshRes.status === 200) {
        console.log("Token refreshed successfully.");
    } else {
        console.log("Token refresh failed:", refreshData);
    }

    // 4. Logout
    console.log("\n4. Logging out...");
    const logoutRes = await fetch(`${BASE_URL}/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: refreshToken }) // passing old refresh token or new one? Logic expects 'token'
    });
    console.log(`Status: ${logoutRes.status}`);

    console.log("\nVerification Complete.");
}

verifyAuth();
