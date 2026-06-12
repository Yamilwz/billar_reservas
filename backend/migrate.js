const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: __dirname + '/.env' });

async function runMigration() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('Conectado a Supabase.');

        const schemaPath = path.join(__dirname, '../database/schema_supabase.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        console.log('Ejecutando schema...');
        await client.query(schemaSql);
        
        console.log('¡Migración exitosa! Las tablas fueron creadas en Supabase.');
    } catch (err) {
        console.error('Error durante la migración:', err);
    } finally {
        await client.end();
    }
}

runMigration();
