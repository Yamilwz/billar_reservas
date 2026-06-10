const pool = require('./backend/config/db');

async function seed() {
    try {
        await pool.query(`
        INSERT INTO products (name, description, price, stock) VALUES
        ('Cerveza Paceña 710ml', 'Cerveza nacional boliviana tamaño familiar', 20.00, 120),
        ('Cerveza Huari 330ml', 'Cerveza nacional premium tamaño personal', 15.00, 100),
        ('Cerveza Corona 355ml', 'Cerveza importada clara', 22.00, 50),
        ('Cerveza Heineken 330ml', 'Cerveza importada clásica', 20.00, 50),
        ('Coca-Cola 2L', 'Gaseosa retornable tamaño familiar', 15.00, 40),
        ('Coca-Cola 300ml', 'Gaseosa en envase personal de vidrio/plástico', 5.00, 100),
        ('Sprite 300ml', 'Gaseosa sabor lima-limón tamaño personal', 5.00, 80),
        ('Agua Vital 600ml', 'Agua embotellada sin gas', 5.00, 50),
        ('Red Bull 250ml', 'Bebida energizante en lata', 20.00, 60),
        ('Monster Energy 473ml', 'Bebida energizante en lata grande', 25.00, 60),
        ('Papas Lays Clásicas', 'Snack salado en bolsa', 15.00, 30),
        ('Papas Pringles', 'Snack salado en tubo sabor original', 25.00, 20),
        ('Nachos con Queso', 'Porción de nachos servidos con queso cheddar fundido', 20.00, 40),
        ('Pipocas', 'Porción de pipocas/palomitas saladas de microondas', 10.00, 50),
        ('Maní Salado', 'Bolsa de maní salado para picar', 5.00, 60),
        ('Marlboro Rojo', 'Cajetilla de 20 cigarrillos', 25.00, 30),
        ('Camel', 'Cajetilla de 20 cigarrillos', 25.00, 20),
        ('L&M Blue', 'Cajetilla de 20 cigarrillos suaves', 20.00, 30),
        ('Lucky Strike', 'Cajetilla de 20 cigarrillos', 20.00, 30),
        ('Gomitas Mogul', 'Paquete de gomitas dulces', 8.00, 40),
        ('Chocolate Sublime', 'Barra de chocolate con maní', 5.00, 50),
        ('Chicles Trident', 'Paquete de chicles sin azúcar', 5.00, 80),
        ('Limón y Sal', 'Porción extra para acompañar cervezas', 3.00, 100);
        `);
        console.log('Seed exitoso');
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
seed();
