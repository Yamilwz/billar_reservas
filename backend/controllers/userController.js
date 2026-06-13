const pool = require('../config/db');

// GET /api/users — devuelve todos los usuarios (sin contraseña)
exports.getAllUsers = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, name, email, role, created_at
             FROM users
             ORDER BY created_at DESC`
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener usuarios', error: error.message });
    }
};

// DELETE /api/users/:id - elimina un usuario por id
exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        // Impedir que el admin se borre a sí mismo para evitar quedarse sin acceso (opcional, pero buena práctica)
        if (req.user.id == id) {
            return res.status(400).json({ message: 'No puedes eliminar tu propia cuenta' });
        }
        await pool.query('DELETE FROM users WHERE id = $1', [id]);
        res.json({ message: 'Usuario eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar usuario', error: error.message });
    }
};
