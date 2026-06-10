CREATE DATABASE IF NOT EXISTS billar_db;
USE billar_db;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('cliente', 'admin') DEFAULT 'cliente',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tables (
    id INT AUTO_INCREMENT PRIMARY KEY,
    table_number INT NOT NULL UNIQUE,
    status ENUM('disponible', 'ocupada', 'mantenimiento') DEFAULT 'disponible',
    price_per_hour DECIMAL(10,2) NOT NULL DEFAULT 10.00
);

-- Insert some default tables
INSERT IGNORE INTO tables (table_number, status, price_per_hour) VALUES 
(1, 'disponible', 10.00), (2, 'disponible', 10.00), 
(3, 'disponible', 12.00), (4, 'disponible', 12.00),
(5, 'disponible', 15.00), (6, 'disponible', 15.00);

CREATE TABLE IF NOT EXISTS reservations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    table_id INT NOT NULL,
    reservation_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status ENUM('pendiente', 'completada', 'cancelada') DEFAULT 'pendiente',
    total_price DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (table_id) REFERENCES tables(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT, -- admin who made the sale
    description VARCHAR(255) DEFAULT 'Venta POS',
    total_amount DECIMAL(10,2) NOT NULL,
    sale_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS sale_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sale_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    price_at_time DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Insert a default admin user (password: admin123)
-- The password hash here is generated with bcrypt using round 10 for 'admin123'
INSERT IGNORE INTO users (name, email, password, role) VALUES 
('Admin Default', 'admin@billar.com', '$2b$10$OtIrtuwxfcwN.FuCChcsH.xXT5HPNcmuB0TRHk3zluCY8zS4Ud7Lu', 'admin');

-- Población de productos
INSERT INTO products (name, description, price, stock) VALUES
-- Cervezas
('Cerveza Paceña 710ml', 'Cerveza nacional boliviana tamaño familiar', 20.00, 120),
('Cerveza Huari 330ml', 'Cerveza nacional premium tamaño personal', 15.00, 100),
('Cerveza Corona 355ml', 'Cerveza importada clara', 22.00, 50),
('Cerveza Heineken 330ml', 'Cerveza importada clásica', 20.00, 50),

-- Bebidas y Energizantes
('Coca-Cola 2L', 'Gaseosa retornable tamaño familiar', 15.00, 40),
('Coca-Cola 300ml', 'Gaseosa en envase personal de vidrio/plástico', 5.00, 100),
('Sprite 300ml', 'Gaseosa sabor lima-limón tamaño personal', 5.00, 80),
('Agua Vital 600ml', 'Agua embotellada sin gas', 5.00, 50),
('Red Bull 250ml', 'Bebida energizante en lata', 20.00, 60),
('Monster Energy 473ml', 'Bebida energizante en lata grande', 25.00, 60),

-- Snacks
('Papas Lays Clásicas', 'Snack salado en bolsa', 15.00, 30),
('Papas Pringles', 'Snack salado en tubo sabor original', 25.00, 20),
('Nachos con Queso', 'Porción de nachos servidos con queso cheddar fundido', 20.00, 40),
('Pipocas', 'Porción de pipocas/palomitas saladas de microondas', 10.00, 50),
('Maní Salado', 'Bolsa de maní salado para picar', 5.00, 60),

-- Cigarros
('Marlboro Rojo', 'Cajetilla de 20 cigarrillos', 25.00, 30),
('Camel', 'Cajetilla de 20 cigarrillos', 25.00, 20),
('L&M Blue', 'Cajetilla de 20 cigarrillos suaves', 20.00, 30),
('Lucky Strike', 'Cajetilla de 20 cigarrillos', 20.00, 30),

-- Extras
('Gomitas Mogul', 'Paquete de gomitas dulces', 8.00, 40),
('Chocolate Sublime', 'Barra de chocolate con maní', 5.00, 50),
('Chicles Trident', 'Paquete de chicles sin azúcar', 5.00, 80),
('Limón y Sal', 'Porción extra para acompañar cervezas', 3.00, 100);
