const pool = require('./backend/config/db');

async function fix() {
    const hash = '$2b$10$OtIrtuwxfcwN.FuCChcsH.xXT5HPNcmuB0TRHk3zluCY8zS4Ud7Lu';
    await pool.query('UPDATE users SET password = ? WHERE email = ?', [hash, 'admin@billar.com']);
    console.log('Done');
    process.exit(0);
}

fix();
