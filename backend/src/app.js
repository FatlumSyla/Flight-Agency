import express from "express";
import cors from "cors";

import flightRoutes from "./routes/flight.routes.js";
import authRoutes from "./routes/auth.routes.js";
import bookingRoutes from "./routes/booking.routes.js";


const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/flights", flightRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/bookings", bookingRoutes);

app.get("/health", (req, res) => {
    res.json({ status: "OK" });
});

export default app;
