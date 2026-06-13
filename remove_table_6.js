require('dotenv').config({ path: './backend/.env' });
const pool = require('./backend/config/db');

async function removeTable() {
    try {
        const result = await pool.query('DELETE FROM tables WHERE table_number = 6');
        console.log(`✅ Mesa eliminada: ${result.rowCount} registros afectados`);
    } catch (err) {
        console.error('❌ Error al eliminar mesa:', err.message);
    } finally {
        process.exit(0);
    }
}

removeTable();
