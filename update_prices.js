require('dotenv').config({ path: './backend/.env' });
const pool = require('./backend/config/db');

async function updatePrices() {
    try {
        const result = await pool.query('UPDATE tables SET price_per_hour = 15.00');
        console.log(`✅ Precios actualizados: ${result.rowCount} mesa(s) modificadas a Bs 15.00`);
    } catch (err) {
        console.error('❌ Error al actualizar precios:', err.message);
    } finally {
        process.exit(0);
    }
}

updatePrices();
