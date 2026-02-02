import express from "express";
import {
    getAllFlights,
    searchFlights,
    createFlight,
    updateFlight,
    deleteFlight
} from "../controllers/flight.controller.js";
import authenticateToken from "../middleware/auth.middleware.js";
import authorizeRole from "../middleware/role.middleware.js";

const router = express.Router();

router.get("/", getAllFlights);
router.get("/search", searchFlights);
router.post("/", authenticateToken, authorizeRole("admin"), createFlight);
router.put("/:id", authenticateToken, authorizeRole("admin"), updateFlight);
router.delete("/:id", authenticateToken, authorizeRole("admin"), deleteFlight);

export default router;
