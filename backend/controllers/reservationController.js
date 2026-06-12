const pool = require('../config/db');

exports.createReservation = async (req, res) => {
    try {
        const { table_id, reservation_date, start_time, end_time } = req.body;
        const user_id = req.user.id;

        // Validar que la mesa no esté reservada en ese horario
        const existing = await pool.query(
            `SELECT id FROM reservations
             WHERE table_id = $1 AND reservation_date = $2 AND status != 'cancelada'
             AND (
                 (start_time <= $3 AND end_time > $4) OR
                 (start_time < $5 AND end_time >= $6) OR
                 (start_time >= $7 AND end_time <= $8)
             )`,
            [table_id, reservation_date, start_time, start_time, end_time, end_time, start_time, end_time]
        );

        if (existing.rows.length > 0) {
            return res.status(400).json({ message: 'La mesa ya está reservada en este horario' });
        }

        // Obtener precio de la mesa
        const tableResult = await pool.query('SELECT price_per_hour FROM tables WHERE id = $1', [table_id]);
        if (tableResult.rows.length === 0) {
            return res.status(404).json({ message: 'Mesa no encontrada' });
        }

        const pricePerHour = tableResult.rows[0].price_per_hour;

        // Calcular duración y precio total
        const start = new Date(`1970-01-01T${start_time}Z`);
        const end   = new Date(`1970-01-01T${end_time}Z`);
        const durationHours = (end - start) / (1000 * 60 * 60);

        if (durationHours <= 0) {
            return res.status(400).json({ message: 'Rango de tiempo inválido' });
        }

        const totalPrice = (pricePerHour * durationHours).toFixed(2);

        const result = await pool.query(
            `INSERT INTO reservations (user_id, table_id, reservation_date, start_time, end_time, total_price)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
            [user_id, table_id, reservation_date, start_time, end_time, totalPrice]
        );

        res.status(201).json({ message: 'Reserva creada con éxito', reservationId: result.rows[0].id });
    } catch (error) {
        res.status(500).json({ message: 'Error al crear la reserva', error: error.message });
    }
};

exports.getUserReservations = async (req, res) => {
    try {
        const user_id = req.user.id;
        const result = await pool.query(
            `SELECT r.*, t.table_number
             FROM reservations r
             JOIN tables t ON r.table_id = t.id
             WHERE r.user_id = $1
             ORDER BY r.reservation_date DESC, r.start_time DESC`,
            [user_id]
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching reservations', error: error.message });
    }
};

exports.getAllReservations = async (req, res) => {
    try {
        const { date } = req.query;
        const queryParams = [];

        let query = `SELECT r.*, t.table_number, u.name as user_name
                     FROM reservations r
                     JOIN tables t ON r.table_id = t.id
                     JOIN users u ON r.user_id = u.id`;

        if (date) {
            queryParams.push(date);
            query += ` WHERE r.reservation_date = $1`;
        }

        query += ` ORDER BY r.reservation_date DESC, r.start_time DESC`;

        const result = await pool.query(query, queryParams);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching reservations', error: error.message });
    }
};

exports.updateReservationStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const resResult = await pool.query('SELECT * FROM reservations WHERE id = $1', [id]);
        if (resResult.rows.length === 0) {
            return res.status(404).json({ message: 'Reserva no encontrada' });
        }

        const reservation = resResult.rows[0];

        // Si se marca como completada, generar venta automática
        if (status === 'completada' && reservation.status !== 'completada') {
            const admin_id = req.user.id;
            const desc = `Cobro de Reserva - Mesa ${reservation.table_id}`;
            await pool.query(
                'INSERT INTO sales (user_id, total_amount, description) VALUES ($1, $2, $3)',
                [admin_id, reservation.total_price, desc]
            );
        }

        await pool.query('UPDATE reservations SET status = $1 WHERE id = $2', [status, id]);
        res.json({ message: 'Estado de reserva actualizado' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating reservation', error: error.message });
    }
};

exports.getBookedSlots = async (req, res) => {
    try {
        const { date } = req.query;
        if (!date) return res.status(400).json({ message: 'Fecha requerida' });

        const result = await pool.query(
            `SELECT table_id, start_time, end_time
             FROM reservations
             WHERE reservation_date = $1 AND status != 'cancelada'`,
            [date]
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching slots', error: error.message });
    }
};
