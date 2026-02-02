import pool from "../config/db.js";

// Helper to get connection and start transaction
// We use pool.getConnection() to get a dedicated client for the transaction
const withTransaction = async (callback) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const result = await callback(connection);
        await connection.commit();
        return result;
    } catch (error) {
        await connection.rollback();
        throw error; // Re-throw to be handled by controller
    } finally {
        connection.release();
    }
};

export const createBooking = async (req, res) => {
    const { flightId, seats } = req.body;
    const userId = req.user.id; // From auth middleware

    if (!flightId || !seats || seats <= 0) {
        return res.status(400).json({ message: "Invalid flight ID or seats quantity" });
    }

    try {
        const bookingId = await withTransaction(async (connection) => {
            // 1. Lock the flight row to prevent race conditions
            const [flights] = await connection.query(
                "SELECT * FROM flights WHERE id = ? FOR UPDATE",
                [flightId]
            );

            if (flights.length === 0) {
                const error = new Error("Flight not found");
                error.status = 404;
                throw error;
            }

            const flight = flights[0];

            // 2. Check seat availability
            if (flight.available_seats < seats) {
                const error = new Error("Not enough seats available");
                error.status = 409; // Conflict
                throw error;
            }

            // 3. Calculate total price
            const totalPrice = Number(flight.price) * seats;

            // 4. Update available seats
            await connection.query(
                "UPDATE flights SET available_seats = available_seats - ? WHERE id = ?",
                [seats, flightId]
            );

            // 5. Insert booking
            const [result] = await connection.query(
                "INSERT INTO bookings (user_id, flight_id, seats, total_price, status) VALUES (?, ?, ?, ?, 'booked')",
                [userId, flightId, seats, totalPrice]
            );

            return result.insertId;
        });

        res.status(201).json({
            message: "Booking confirmed",
            bookingId: bookingId
        });

    } catch (error) {
        console.error("Booking error:", error);
        const status = error.status || 500;
        const message = error.message || "Failed to create booking";
        res.status(status).json({ message });
    }
};

export const cancelBooking = async (req, res) => {
    const bookingId = req.params.id;
    const userId = req.user.id;

    try {
        await withTransaction(async (connection) => {
            // 1. Lock booking row to verify ownership and status
            const [bookings] = await connection.query(
                "SELECT * FROM bookings WHERE id = ? FOR UPDATE",
                [bookingId]
            );

            if (bookings.length === 0) {
                const error = new Error("Booking not found");
                error.status = 404;
                throw error;
            }

            const booking = bookings[0];

            if (booking.user_id !== userId) {
                const error = new Error("Unauthorized to cancel this booking");
                error.status = 403;
                throw error;
            }

            if (booking.status === 'cancelled') {
                const error = new Error("Booking is already cancelled");
                error.status = 400;
                throw error;
            }

            // 2. Lock flight row to update seats safely
            // Technically not strictly necessary strictly IF we trust the previous read, 
            // but good practice to lock the resource we are mutating dependent on previous state.
            // However, simply updating is atomic if we don't need to read 'available_seats' first.
            // But we want to ensure consistency.

            // 3. Update booking status
            await connection.query(
                "UPDATE bookings SET status = 'cancelled' WHERE id = ?",
                [bookingId]
            );

            // 4. Restore available seats
            await connection.query(
                "UPDATE flights SET available_seats = available_seats + ? WHERE id = ?",
                [booking.seats, booking.flight_id]
            );
        });

        res.json({ message: "Booking cancelled and seats restored" });

    } catch (error) {
        console.error("Cancellation error:", error);
        const status = error.status || 500;
        const message = error.message || "Failed to cancel booking";
        res.status(status).json({ message });
    }
};

export const getUserBookings = async (req, res) => {
    const userId = req.user.id;
    const {
        sortBy = "created_at",
        sortOrder = "DESC",
        limit = 10,
        offset = 0
    } = req.query;

    // Validation
    const allowedSortFields = ["created_at", "depart_time", "total_price"];
    const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : "created_at";
    const validSortOrder = sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC";

    try {
        // We use aliases to avoid ambiguity between bookings and flights columns
        const query = `
            SELECT 
                b.id, b.seats, b.total_price, b.status, b.created_at,
                f.flight_number, f.origin, f.destination, f.depart_time, f.arrive_time, f.price as flight_unit_price
            FROM bookings b 
            JOIN flights f ON b.flight_id = f.id 
            WHERE b.user_id = ? 
            ORDER BY ${validSortBy === 'depart_time' ? 'f.depart_time' : 'b.' + validSortBy} ${validSortOrder}
            LIMIT ? OFFSET ?
        `;

        const [rows] = await pool.query(query, [userId, parseInt(limit), parseInt(offset)]);

        // Also get total count for pagination metadata
        const [countResult] = await pool.query(
            "SELECT COUNT(*) as total FROM bookings WHERE user_id = ?",
            [userId]
        );

        res.json({
            results: rows,
            total: countResult[0].total,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
    } catch (error) {
        console.error("Fetch bookings error:", error);
        res.status(500).json({ message: "Failed to fetch bookings" });
    }
};
