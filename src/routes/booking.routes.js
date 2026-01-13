import express from "express";
import { createBooking, cancelBooking, getUserBookings } from "../controllers/booking.controller.js";
import authenticateToken from "../middleware/auth.middleware.js";

const router = express.Router();

// All routes are protected
router.use(authenticateToken);

router.post("/", createBooking);
router.post("/:id/cancel", cancelBooking);
router.get("/", getUserBookings);

export default router;
