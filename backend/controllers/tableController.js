const pool = require('../config/db');

exports.getAllTables = async (req, res) => {
    try {
        const [tables] = await pool.query('SELECT * FROM tables ORDER BY table_number ASC');
        res.json(tables);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching tables', error: error.message });
    }
};

exports.updateTableStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        await pool.query('UPDATE tables SET status = ? WHERE id = ?', [status, id]);
        res.json({ message: 'Table status updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating table status', error: error.message });
    }
};
