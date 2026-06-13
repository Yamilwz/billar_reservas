const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const reservationRoutes = require('./routes/reservationRoutes');
const productRoutes = require('./routes/productRoutes');
const saleRoutes = require('./routes/saleRoutes');
const tableRoutes = require('./routes/tableRoutes');
const userRoutes = require('./routes/userRoutes');

const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Static files (Frontend)
app.use(express.static(path.join(__dirname, '../frontend')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/products', productRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/users', userRoutes);

const PORT = process.env.PORT || 3000;
const pool = require('./config/db');

app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    
    // Check database connection on startup
    try {
        if (!process.env.DATABASE_URL) {
            console.error('❌ ERROR FATAL: No se ha configurado DATABASE_URL en las variables de entorno.');
        } else {
            await pool.query('SELECT 1');
            console.log('✅ Conexión a Supabase exitosa.');
        }
    } catch (err) {
        console.error('❌ ERROR de conexión a Supabase:', err.message);
        console.error('Verifica tu DATABASE_URL y que la contraseña sea correcta.');
    }
});
