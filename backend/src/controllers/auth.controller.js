import bcrypt from "bcrypt";
import userModel from "../models/userModel.js";
import tokenModel from "../models/tokenModel.js";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../utils/jwt.js";

const register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const existingUser = await userModel.findByEmail(email);
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        // Default role to "user" if not provided, or validation logic here
        const userRole = role === "admin" ? "admin" : "user";

        const userId = await userModel.create(name, email, passwordHash, userRole);

        res.status(201).json({ message: "User registered successfully", userId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const user = await userModel.findByEmail(email);
        if (!user) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        // Store refresh token
        await tokenModel.storeRefreshToken(user.id, refreshToken);

        res.json({ accessToken, refreshToken, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
};

const refreshToken = async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(401).json({ message: "Refresh token required" });
        }

        const storedToken = await tokenModel.findRefreshToken(token);
        if (!storedToken) {
            return res.status(403).json({ message: "Invalid refresh token" });
        }

        // Check if token matches DB and logic (could also check expiration from DB if persisted there)
        if (new Date(storedToken.expires_at) < new Date()) {
            await tokenModel.deleteRefreshToken(token);
            return res.status(403).json({ message: "Refresh token expired" });
        }

        let decoded;
        try {
            decoded = verifyRefreshToken(token);
        } catch (err) {
            await tokenModel.deleteRefreshToken(token); // Cleanup invalid/expired token if verify fails
            return res.status(403).json({ message: "Invalid refresh token" });
        }

        // Token Rotation: Delete old, issue new
        await tokenModel.deleteRefreshToken(token);

        const user = await userModel.findById(decoded.id);
        if (!user) {
            return res.status(403).json({ message: "User not found" });
        }

        const newAccessToken = generateAccessToken(user);
        const newRefreshToken = generateRefreshToken(user);

        await tokenModel.storeRefreshToken(user.id, newRefreshToken);

        res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
};

const logout = async (req, res) => {
    try {
        const { token } = req.body; // Expecting refresh token to identify session
        if (token) {
            await tokenModel.deleteRefreshToken(token);
        }
        res.json({ message: "Logged out successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export default { register, login, refreshToken, logout };
