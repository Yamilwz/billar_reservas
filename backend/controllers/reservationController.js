const pool = require('../config/db');

exports.createReservation = async (req, res) => {
    try {
        const { table_id, reservation_date, start_time, end_time, receipt_base64 } = req.body;
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
            `INSERT INTO reservations (user_id, table_id, reservation_date, start_time, end_time, total_price, receipt_url)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
            [user_id, table_id, reservation_date, start_time, end_time, totalPrice, receipt_base64 || null]
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
            const desc = `Cobro Final de Reserva - Mesa ${reservation.table_id}`;
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

exports.assignTableTime = async (req, res) => {
    try {
        const { table_id, hours_to_add } = req.body;
        const user_id = req.user.id;
        const hours = parseFloat(hours_to_add);

        if (!hours || hours <= 0) return res.status(400).json({ message: 'Cantidad de horas inválida' });

        const tableResult = await pool.query('SELECT price_per_hour FROM tables WHERE id = $1', [table_id]);
        if (tableResult.rows.length === 0) return res.status(404).json({ message: 'Mesa no encontrada' });
        const pricePerHour = tableResult.rows[0].price_per_hour;

        // Fecha actual en la zona local configurada (usaremos local DB time para facilitar)
        const dateQuery = await pool.query("SELECT CURRENT_DATE at time zone 'America/La_Paz' as today, CURRENT_TIME at time zone 'America/La_Paz' as now_time");
        const today = dateQuery.rows[0].today.toISOString().split('T')[0];
        let now_time = dateQuery.rows[0].now_time; 
        // a veces now_time falla al parsearse, usemos JS:
        const localDate = new Date(new Date().toLocaleString("en-US", {timeZone: "America/La_Paz"}));
        const tToday = localDate.toISOString().split('T')[0];
        const tNow = localDate.toTimeString().split(' ')[0]; // HH:MM:SS

        // Buscar reserva activa para esta mesa hoy (pendiente o confirmada, y que no haya terminado)
        const activeRes = await pool.query(
            `SELECT id, start_time, end_time FROM reservations 
             WHERE table_id = $1 AND reservation_date = $2 
             AND status IN ('pendiente', 'confirmada')
             AND end_time > $3
             ORDER BY end_time DESC LIMIT 1`,
            [table_id, tToday, tNow]
        );

        if (activeRes.rows.length > 0) {
            // Ampliar la reserva existente
            const r = activeRes.rows[0];
            const oldEnd = r.end_time; // HH:MM:SS
            const split = oldEnd.split(':');
            const endDt = new Date(localDate);
            endDt.setHours(parseInt(split[0]), parseInt(split[1]), parseInt(split[2]||0));
            
            endDt.setMinutes(endDt.getMinutes() + (hours * 60));
            const newEnd = endDt.toTimeString().split(' ')[0];

            // re-calcular precio (desde start hasta newEnd)
            const splitStart = r.start_time.split(':');
            const startDt = new Date(localDate);
            startDt.setHours(parseInt(splitStart[0]), parseInt(splitStart[1]), parseInt(splitStart[2]||0));

            const durHours = (endDt - startDt) / (1000 * 60 * 60);
            const newPrice = (pricePerHour * durHours).toFixed(2);

            await pool.query(
                `UPDATE reservations SET end_time = $1, total_price = $2 WHERE id = $3`,
                [newEnd, newPrice, r.id]
            );

            // Cambiar la mesa a ocupada si estaba disponible
            await pool.query(`UPDATE tables SET status = 'ocupada' WHERE id = $1`, [table_id]);

            return res.json({ message: 'Tiempo ampliado correctamente', new_end: newEnd });
        } else {
            // Crear nueva reserva
            const startDt = new Date(localDate);
            const endDt = new Date(localDate);
            endDt.setMinutes(endDt.getMinutes() + (hours * 60));

            const nStart = startDt.toTimeString().split(' ')[0];
            const nEnd = endDt.toTimeString().split(' ')[0];
            const nPrice = (pricePerHour * hours).toFixed(2);

            await pool.query(
                `INSERT INTO reservations (user_id, table_id, reservation_date, start_time, end_time, total_price, status)
                 VALUES ($1, $2, $3, $4, $5, $6, 'confirmada')`,
                [user_id, table_id, tToday, nStart, nEnd, nPrice]
            );

            // Cambiar a ocupada
            await pool.query(`UPDATE tables SET status = 'ocupada' WHERE id = $1`, [table_id]);

            return res.status(201).json({ message: 'Hora asignada y mesa ocupada con éxito' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error en asignación', error: error.message });
    }
};
