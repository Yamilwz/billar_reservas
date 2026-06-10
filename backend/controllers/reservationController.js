const pool = require('../config/db');

exports.createReservation = async (req, res) => {
    try {
        const { table_id, reservation_date, start_time, end_time } = req.body;
        const user_id = req.user.id;

        // Validation: Check if table is already reserved in the given time frame
        const [existing] = await pool.query(
            `SELECT * FROM reservations 
             WHERE table_id = ? AND reservation_date = ? AND status != 'cancelada'
             AND (
                 (start_time <= ? AND end_time > ?) OR
                 (start_time < ? AND end_time >= ?) OR
                 (start_time >= ? AND end_time <= ?)
             )`,
            [table_id, reservation_date, start_time, start_time, end_time, end_time, start_time, end_time]
        );

        if (existing.length > 0) {
            return res.status(400).json({ message: 'La mesa ya está reservada en este horario' });
        }

        // Get table price to calculate total price
        const [tables] = await pool.query('SELECT price_per_hour FROM tables WHERE id = ?', [table_id]);
        if (tables.length === 0) return res.status(404).json({ message: 'Mesa no encontrada' });

        const pricePerHour = tables[0].price_per_hour;
        
        // Simple duration calculation (assumes same day)
        const start = new Date(`1970-01-01T${start_time}Z`);
        const end = new Date(`1970-01-01T${end_time}Z`);
        const durationHours = (end - start) / (1000 * 60 * 60);
        
        if (durationHours <= 0) return res.status(400).json({ message: 'Rango de tiempo inválido' });

        const totalPrice = (pricePerHour * durationHours).toFixed(2);

        const [result] = await pool.query(
            `INSERT INTO reservations (user_id, table_id, reservation_date, start_time, end_time, total_price) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [user_id, table_id, reservation_date, start_time, end_time, totalPrice]
        );

        res.status(201).json({ message: 'Reserva creada con éxito', reservationId: result.insertId });
    } catch (error) {
        res.status(500).json({ message: 'Error al crear la reserva', error: error.message });
    }
};

exports.getUserReservations = async (req, res) => {
    try {
        const user_id = req.user.id;
        const [reservations] = await pool.query(
            `SELECT r.*, t.table_number 
             FROM reservations r 
             JOIN tables t ON r.table_id = t.id 
             WHERE r.user_id = ? ORDER BY r.reservation_date DESC, r.start_time DESC`,
            [user_id]
        );
        res.json(reservations);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching reservations', error: error.message });
    }
};

exports.getAllReservations = async (req, res) => {
    try {
        const { date } = req.query;
        let query = `SELECT r.*, t.table_number, u.name as user_name 
                     FROM reservations r 
                     JOIN tables t ON r.table_id = t.id 
                     JOIN users u ON r.user_id = u.id `;
        const queryParams = [];

        if (date) {
            query += `WHERE r.reservation_date = ? `;
            queryParams.push(date);
        }

        query += `ORDER BY r.reservation_date DESC, r.start_time DESC`;

        const [reservations] = await pool.query(query, queryParams);
        res.json(reservations);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching reservations', error: error.message });
    }
};

exports.updateReservationStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const [reservations] = await pool.query('SELECT * FROM reservations WHERE id = ?', [id]);
        if (reservations.length === 0) return res.status(404).json({ message: 'Reserva no encontrada' });

        const reservation = reservations[0];

        if (status === 'completada' && reservation.status !== 'completada') {
            const admin_id = req.user.id;
            const desc = `Cobro de Reserva - Mesa ${reservation.table_id}`;
            await pool.query(
                'INSERT INTO sales (user_id, total_amount, description) VALUES (?, ?, ?)',
                [admin_id, reservation.total_price, desc]
            );
        }

        await pool.query('UPDATE reservations SET status = ? WHERE id = ?', [status, id]);
        res.json({ message: 'Estado de reserva actualizado' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating reservation', error: error.message });
    }
};

// Return booked slots for the date map
exports.getBookedSlots = async (req, res) => {
    try {
        const { date } = req.query;
        if (!date) return res.status(400).json({ message: 'Fecha requerida' });

        const [slots] = await pool.query(
            `SELECT table_id, start_time, end_time 
             FROM reservations 
             WHERE reservation_date = ? AND status != 'cancelada'`,
            [date]
        );
        res.json(slots);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching slots', error: error.message });
    }
};
