# 🎱 Sistema de Reservas para Salón de Billar

Un sistema completo de gestión para salones de billar que incluye reservas en tiempo real, punto de venta (POS), control de inventario y reportes financieros.

---

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Tecnologías](#-tecnologías)
- [Arquitectura del Proyecto](#-arquitectura-del-proyecto)
- [Requisitos Previos](#-requisitos-previos)
- [Instalación y Configuración](#-instalación-y-configuración)
- [Base de Datos](#-base-de-datos)
- [API Endpoints](#-api-endpoints)
- [Módulos del Sistema](#-módulos-del-sistema)
- [Credenciales por Defecto](#-credenciales-por-defecto)
- [Autor](#-autor)

---

## ✨ Características

- 🔐 **Autenticación JWT** — Registro, login y control de acceso por roles (`admin` / `cliente`)
- 🎱 **Gestión de Mesas** — Visualización del estado en tiempo real (disponible, ocupada, mantenimiento)
- 📅 **Reservas** — Sistema de reservas con cálculo automático de precio por horas
- 🛒 **Punto de Venta (POS)** — Carrito de compras y registro de ventas con múltiples productos
- 📦 **Inventario** — CRUD completo de productos con control de stock
- 💰 **Finanzas** — Dashboard con resumen de ingresos por reservas y ventas POS
- 👤 **Perfil de usuario** — Historial de reservas del cliente autenticado

---

## 🛠 Tecnologías

| Capa        | Tecnología                               |
|-------------|------------------------------------------|
| **Backend** | Node.js, Express.js 5                    |
| **Base de datos** | MySQL 8 (via XAMPP)               |
| **ORM / Driver** | mysql2                              |
| **Autenticación** | JSON Web Tokens (jsonwebtoken)     |
| **Seguridad** | bcryptjs (hash de contraseñas)          |
| **Frontend** | HTML5, CSS3 Vanilla, JavaScript ES6+     |
| **Entorno** | dotenv                                   |

---

## 📁 Arquitectura del Proyecto

```
billar/
├── backend/
│   ├── config/
│   │   └── db.js                  # Conexión MySQL
│   ├── controllers/
│   │   ├── authController.js      # Registro y login
│   │   ├── reservationController.js # CRUD de reservas
│   │   ├── tableController.js     # Estado de mesas
│   │   ├── productController.js   # Inventario
│   │   └── saleController.js      # POS y ventas
│   ├── middleware/
│   │   └── authMiddleware.js      # Verificación JWT y roles
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── reservationRoutes.js
│   │   ├── tableRoutes.js
│   │   ├── productRoutes.js
│   │   └── saleRoutes.js
│   ├── .env                       # Variables de entorno
│   └── server.js                  # Punto de entrada del servidor
├── database/
│   └── schema.sql                 # Esquema completo + datos semilla
├── frontend/
│   ├── css/
│   │   └── style.css              # Estilos globales (tema oscuro)
│   ├── js/
│   │   ├── api.js                 # Capa de comunicación con la API
│   │   ├── nav.js                 # Navegación y manejo de sesión
│   │   └── map.js                 # Mapa interactivo de mesas
│   ├── index.html                 # Dashboard principal (mesas)
│   ├── login.html
│   ├── register.html
│   ├── profile.html               # Perfil y reservas del cliente
│   ├── admin_reservations.html    # Gestión de reservas (admin)
│   ├── admin_inventory.html       # Gestión de inventario (admin)
│   ├── admin_pos.html             # Punto de venta (admin)
│   └── admin_finances.html        # Reporte financiero (admin)
├── seed.js                        # Script de datos de prueba
├── package.json
└── README.md
```

---

## ⚙️ Requisitos Previos

- [Node.js](https://nodejs.org/) v18+
- [XAMPP](https://www.apachefriends.org/) (con MySQL activo en puerto 3306)
- Git

---

## 🚀 Instalación y Configuración

### 1. Clonar el repositorio

```bash
git clone https://github.com/Yamilwz/billar_reservas.git
cd billar_reservas
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Editar el archivo `backend/.env`:

```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=          # Dejar vacío si XAMPP no tiene contraseña
DB_NAME=billar_db
JWT_SECRET=super_secret_jwt_key_billar_123
```

### 4. Inicializar la base de datos

1. Abrir **phpMyAdmin** o el cliente MySQL de tu preferencia.
2. Ejecutar el script completo:

```bash
# Desde la línea de comandos MySQL
mysql -u root -p < database/schema.sql
```

Esto crea la base de datos `billar_db`, todas las tablas, 6 mesas por defecto, el usuario administrador y el catálogo de productos.

### 5. Iniciar el servidor

```bash
node backend/server.js
```

El servidor quedará disponible en: **http://localhost:3000**

---

## 🗄️ Base de Datos

### Tablas principales

| Tabla         | Descripción                                      |
|---------------|--------------------------------------------------|
| `users`       | Usuarios con roles `admin` y `cliente`           |
| `tables`      | Mesas de billar con estado y precio/hora         |
| `reservations`| Reservas vinculadas a usuario y mesa             |
| `products`    | Catálogo de productos del bar/tienda             |
| `sales`       | Cabecera de ventas POS                           |
| `sale_items`  | Detalle de productos por venta                   |

### Diagrama de relaciones

```
users ──┬── reservations ── tables
        └── sales ── sale_items ── products
```

---

## 📡 API Endpoints

### Autenticación
| Método | Ruta                | Acceso  | Descripción         |
|--------|---------------------|---------|---------------------|
| POST   | `/api/auth/register`| Público | Registro de usuario |
| POST   | `/api/auth/login`   | Público | Login, retorna JWT  |

### Mesas
| Método | Ruta               | Acceso | Descripción              |
|--------|--------------------|--------|--------------------------|
| GET    | `/api/tables`      | Auth   | Listar todas las mesas   |
| PUT    | `/api/tables/:id`  | Admin  | Actualizar estado/precio |

### Reservas
| Método | Ruta                     | Acceso | Descripción                    |
|--------|--------------------------|--------|--------------------------------|
| GET    | `/api/reservations`      | Admin  | Todas las reservas             |
| GET    | `/api/reservations/my`   | Auth   | Reservas del usuario actual    |
| POST   | `/api/reservations`      | Auth   | Crear reserva                  |
| PUT    | `/api/reservations/:id`  | Admin  | Actualizar estado de reserva   |
| DELETE | `/api/reservations/:id`  | Admin  | Eliminar reserva               |

### Inventario (Productos)
| Método | Ruta                 | Acceso | Descripción         |
|--------|----------------------|--------|---------------------|
| GET    | `/api/products`      | Auth   | Listar productos    |
| POST   | `/api/products`      | Admin  | Crear producto      |
| PUT    | `/api/products/:id`  | Admin  | Actualizar producto |
| DELETE | `/api/products/:id`  | Admin  | Eliminar producto   |

### Ventas POS
| Método | Ruta          | Acceso | Descripción                     |
|--------|---------------|--------|---------------------------------|
| POST   | `/api/sales`  | Admin  | Registrar venta con sus items   |
| GET    | `/api/sales`  | Admin  | Historial de ventas y totales   |

---

## 🖥️ Módulos del Sistema

### 👤 Cliente
- **Inicio** (`/index.html`) — Mapa visual de mesas con estado en tiempo real
- **Reservar** — Selección de mesa, fecha y horario con cálculo de precio automático
- **Mi Perfil** (`/profile.html`) — Historial de reservas personales

### 🔧 Administrador
- **Gestión de Reservas** (`/admin_reservations.html`) — Ver, confirmar, completar o cancelar reservas
- **Inventario** (`/admin_inventory.html`) — Agregar, editar y eliminar productos del bar
- **Punto de Venta** (`/admin_pos.html`) — Carrito de compras para ventas en mostrador
- **Finanzas** (`/admin_finances.html`) — Resumen de ingresos por reservas y ventas

---

## 🔑 Credenciales por Defecto

| Rol   | Email              | Contraseña |
|-------|--------------------|------------|
| Admin | admin@billar.com   | admin123   |

> ⚠️ **Importante:** Cambiar la contraseña del administrador y el valor de `JWT_SECRET` en producción.

---

## 👤 Autor

**Yamilwz** — [github.com/Yamilwz](https://github.com/Yamilwz)

---

> Proyecto desarrollado como sistema de gestión integral para salones de billar.
