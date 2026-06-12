const pool = require('../config/db');

exports.getAllTables = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM tables ORDER BY table_number ASC');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching tables', error: error.message });
    }
};

exports.updateTableStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, price_per_hour } = req.body;

        if (price_per_hour !== undefined) {
            await pool.query(
                'UPDATE tables SET status = $1, price_per_hour = $2 WHERE id = $3',
                [status, price_per_hour, id]
            );
        } else {
            await pool.query('UPDATE tables SET status = $1 WHERE id = $2', [status, id]);
        }

        res.json({ message: 'Table updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating table', error: error.message });
    }
};
