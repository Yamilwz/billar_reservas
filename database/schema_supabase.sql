-- ============================================================
-- Schema para Supabase (PostgreSQL) - Sistema de Billar
-- Ejecutar en: Supabase → SQL Editor → New query
-- ============================================================

-- USUARIOS
CREATE TABLE IF NOT EXISTS users (
    id         SERIAL PRIMARY KEY,
    name       VARCHAR(100) NOT NULL,
    email      VARCHAR(100) UNIQUE NOT NULL,
    password   VARCHAR(255) NOT NULL,
    role       TEXT DEFAULT 'cliente' CHECK (role IN ('cliente', 'admin')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- MESAS
CREATE TABLE IF NOT EXISTS tables (
    id            SERIAL PRIMARY KEY,
    table_number  INT NOT NULL UNIQUE,
    status        TEXT DEFAULT 'disponible' CHECK (status IN ('disponible', 'ocupada', 'mantenimiento')),
    price_per_hour DECIMAL(10,2) NOT NULL DEFAULT 15.00
);

-- Mesas por defecto
INSERT INTO tables (table_number, status, price_per_hour) VALUES 
(1, 'disponible', 15.00),
(2, 'disponible', 15.00),
(3, 'disponible', 15.00),
(4, 'disponible', 15.00),
(5, 'disponible', 15.00)
ON CONFLICT (table_number) DO NOTHING;

-- RESERVAS
CREATE TABLE IF NOT EXISTS reservations (
    id               SERIAL PRIMARY KEY,
    user_id          INT NOT NULL,
    table_id         INT NOT NULL,
    reservation_date DATE NOT NULL,
    start_time       TIME NOT NULL,
    end_time         TIME NOT NULL,
    status           TEXT DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'completada', 'cancelada')),
    total_price      DECIMAL(10,2),
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (table_id) REFERENCES tables(id) ON DELETE CASCADE
);

-- PRODUCTOS
CREATE TABLE IF NOT EXISTS products (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    description TEXT,
    price       DECIMAL(10,2) NOT NULL,
    stock       INT NOT NULL DEFAULT 0,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- VENTAS (cabecera)
CREATE TABLE IF NOT EXISTS sales (
    id           SERIAL PRIMARY KEY,
    user_id      INT,
    description  VARCHAR(255) DEFAULT 'Venta POS',
    total_amount DECIMAL(10,2) NOT NULL,
    sale_date    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ITEMS DE VENTA (detalle)
CREATE TABLE IF NOT EXISTS sale_items (
    id            SERIAL PRIMARY KEY,
    sale_id       INT NOT NULL,
    product_id    INT NOT NULL,
    quantity      INT NOT NULL,
    price_at_time DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- ============================================================
-- DATOS SEMILLA
-- ============================================================

-- Admin por defecto (contraseña: admin123)
INSERT INTO users (name, email, password, role) VALUES 
('Admin Default', 'admin@billar.com', '$2b$10$OtIrtuwxfcwN.FuCChcsH.xXT5HPNcmuB0TRHk3zluCY8zS4Ud7Lu', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Productos
INSERT INTO products (name, description, price, stock) VALUES
-- Cervezas
('Cerveza Paceña 710ml',  'Cerveza nacional boliviana tamaño familiar',      20.00, 120),
('Cerveza Huari 330ml',   'Cerveza nacional premium tamaño personal',         15.00, 100),
('Cerveza Corona 355ml',  'Cerveza importada clara',                          22.00,  50),
('Cerveza Heineken 330ml','Cerveza importada clásica',                        20.00,  50),
-- Bebidas
('Coca-Cola 2L',          'Gaseosa retornable tamaño familiar',               15.00,  40),
('Coca-Cola 300ml',       'Gaseosa en envase personal',                        5.00, 100),
('Sprite 300ml',          'Gaseosa sabor lima-limón tamaño personal',          5.00,  80),
('Agua Vital 600ml',      'Agua embotellada sin gas',                          5.00,  50),
('Red Bull 250ml',        'Bebida energizante en lata',                       20.00,  60),
('Monster Energy 473ml',  'Bebida energizante en lata grande',                25.00,  60),
-- Snacks
('Papas Lays Clásicas',   'Snack salado en bolsa',                            15.00,  30),
('Papas Pringles',        'Snack salado en tubo sabor original',              25.00,  20),
('Nachos con Queso',      'Porción de nachos con queso cheddar fundido',      20.00,  40),
('Pipocas',               'Porción de palomitas saladas',                     10.00,  50),
('Maní Salado',           'Bolsa de maní salado para picar',                   5.00,  60),
-- Cigarros
('Marlboro Rojo',         'Cajetilla de 20 cigarrillos',                      25.00,  30),
('Camel',                 'Cajetilla de 20 cigarrillos',                      25.00,  20),
('L&M Blue',              'Cajetilla de 20 cigarrillos suaves',               20.00,  30),
('Lucky Strike',          'Cajetilla de 20 cigarrillos',                      20.00,  30),
-- Extras
('Gomitas Mogul',         'Paquete de gomitas dulces',                         8.00,  40),
('Chocolate Sublime',     'Barra de chocolate con maní',                       5.00,  50),
('Chicles Trident',       'Paquete de chicles sin azúcar',                     5.00,  80),
('Limón y Sal',           'Porción extra para acompañar cervezas',             3.00, 100);
