import pool from "../config/db.js";

export const getAllFlights = async (req, res) => {
    try {
        const [rows] = await pool.query(
            "SELECT * FROM flights ORDER BY depart_time ASC"
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch flights" });
    }
};

export const createFlight = async (req, res) => {
    const {
        flight_number,
        origin,
        destination,
        depart_time,
        arrive_time,
        capacity,
        price
    } = req.body;

    // Basic Validation
    if (!flight_number || !origin || !destination || !depart_time || !arrive_time || !capacity || !price) {
        return res.status(400).json({ message: "All fields are required" });
    }
    if (capacity <= 0 || price < 0) {
        return res.status(400).json({ message: "Invalid capacity or price" });
    }

    try {
        const [result] = await pool.query(
            `INSERT INTO flights
      (flight_number, origin, destination, depart_time, arrive_time, capacity, available_seats, price)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                flight_number,
                origin,
                destination,
                depart_time,
                arrive_time,
                capacity,
                capacity, // available_seats starts equal to capacity
                price
            ]
        );

        res.status(201).json({
            message: "Flight created",
            flightId: result.insertId
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to create flight" });
    }
};

export const updateFlight = async (req, res) => {
    const flightId = req.params.id;
    const {
        flight_number,
        origin,
        destination,
        depart_time,
        arrive_time,
        capacity,
        price
    } = req.body;

    // Basic Validation
    if (!flight_number || !origin || !destination || !depart_time || !arrive_time || !capacity || !price) {
        return res.status(400).json({ message: "All fields are required" });
    }
    if (capacity <= 0 || price < 0) {
        return res.status(400).json({ message: "Invalid capacity or price" });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Get current flight details to check bookings
        const [existing] = await connection.query("SELECT * FROM flights WHERE id = ? FOR UPDATE", [flightId]);

        if (existing.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: "Flight not found" });
        }

        const flight = existing[0];
        const bookedSeats = flight.capacity - flight.available_seats;

        // 2. Prevent reducing capacity below already booked seats
        if (capacity < bookedSeats) {
            await connection.rollback();
            return res.status(400).json({
                message: `Cannot reduce capacity to ${capacity}. ${bookedSeats} seats are already booked.`
            });
        }

        // 3. Calculate new available seats
        const newAvailableSeats = capacity - bookedSeats;

        // 4. Update flight
        await connection.query(
            `UPDATE flights 
             SET flight_number = ?, origin = ?, destination = ?, depart_time = ?, arrive_time = ?, capacity = ?, available_seats = ?, price = ?
             WHERE id = ?`,
            [flight_number, origin, destination, depart_time, arrive_time, capacity, newAvailableSeats, price, flightId]
        );

        await connection.commit();
        res.json({ message: "Flight updated successfully" });

    } catch (err) {
        await connection.rollback();
        console.error(err);
        res.status(500).json({ message: "Failed to update flight" });
    } finally {
        connection.release();
    }
};


export const searchFlights = async (req, res) => {
    const {
        origin,
        destination,
        departDate,
        startDate,
        endDate,
        minSeats,
        minPrice,
        maxPrice,
        sortBy = "depart_time",
        sortOrder = "ASC",
        limit = 10,
        offset = 0
    } = req.query;

    let query = "SELECT * FROM flights WHERE 1=1";
    const params = [];

    if (origin) {
        query += " AND origin = ?";
        params.push(origin);
    }
    if (destination) {
        query += " AND destination = ?";
        params.push(destination);
    }
    if (departDate) {
        query += " AND DATE(depart_time) = ?";
        params.push(departDate);
    } else {
        if (startDate) {
            query += " AND depart_time >= ?";
            params.push(startDate);
        }
        if (endDate) {
            query += " AND depart_time <= ?";
            params.push(endDate);
        }
    }
    if (minSeats) {
        query += " AND available_seats >= ?";
        params.push(parseInt(minSeats));
    }
    if (minPrice) {
        query += " AND price >= ?";
        params.push(parseFloat(minPrice));
    }
    if (maxPrice) {
        query += " AND price <= ?";
        params.push(parseFloat(maxPrice));
    }

    // Sort validation
    const allowedSortFields = ["price", "depart_time"];
    const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : "depart_time";
    const validSortOrder = sortOrder.toUpperCase() === "DESC" ? "DESC" : "ASC";

    query += ` ORDER BY ${validSortBy} ${validSortOrder}`;

    // Pagination
    query += " LIMIT ? OFFSET ?";
    params.push(parseInt(limit), parseInt(offset));

    try {
        const [rows] = await pool.query(query, params);

        // Also get total count for pagination info if needed, but for now just Return rows
        res.json({
            results: rows,
            count: rows.length,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
    } catch (err) {
        console.error("Search Error:", err);
        res.status(500).json({ message: "Search failed" });
    }
};

export const deleteFlight = async (req, res) => {
    const flightId = req.params.id;

    try {
        const [rows] = await pool.query("SELECT * FROM flights WHERE id = ?", [flightId]);

        if (rows.length === 0) {
            return res.status(404).json({ message: "Flight not found" });
        }

        const flight = rows[0];
        const bookedSeats = flight.capacity - flight.available_seats;

        if (bookedSeats > 0) {
            return res.status(400).json({
                message: `Cannot delete flight. It has ${bookedSeats} active bookings.`
            });
        }

        await pool.query("DELETE FROM flights WHERE id = ?", [flightId]);
        res.json({ message: "Flight deleted successfully" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to delete flight" });
    }
};

