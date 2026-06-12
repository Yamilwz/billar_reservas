# 🎱 Sistema de Reservas para Salón de Billar

Un sistema completo de gestión para salones de billar que incluye reservas en tiempo real, punto de venta (POS), control de inventario y reportes financieros. 
**Actualizado y configurado para producción en la nube con Supabase y Render.**

---

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Tecnologías](#-tecnologías)
- [Arquitectura del Proyecto](#-arquitectura-del-proyecto)
- [Requisitos Previos](#-requisitos-previos)
- [Instalación Local](#-instalación-local)
- [Despliegue en Producción](#-despliegue-en-producción-render--supabase)
- [Base de Datos](#-base-de-datos)
- [API Endpoints](#-api-endpoints)
- [Módulos del Sistema](#-módulos-del-sistema)
- [Credenciales por Defecto](#-credenciales-por-defecto)

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
| **Base de datos** | PostgreSQL (via Supabase)         |
| **ORM / Driver** | pg (node-postgres)                   |
| **Autenticación** | JSON Web Tokens (jsonwebtoken)     |
| **Seguridad** | bcryptjs (hash de contraseñas)          |
| **Frontend** | HTML5, CSS3 Vanilla, JavaScript ES6+     |
| **Despliegue**| Render (Web Service)                     |

---

## 📁 Arquitectura del Proyecto

```
billar/
├── backend/
│   ├── config/
│   │   └── db.js                  # Conexión PostgreSQL (Supabase)
│   ├── controllers/
│   │   ├── authController.js      # Registro y login
│   │   ├── reservationController.js # CRUD de reservas
│   │   ├── tableController.js     # Estado de mesas
│   │   ├── productController.js   # Inventario
│   │   └── saleController.js      # Transacciones POS
│   ├── middleware/
│   │   └── authMiddleware.js      # Verificación JWT y roles
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── reservationRoutes.js
│   │   ├── tableRoutes.js
│   │   ├── productRoutes.js
│   │   └── saleRoutes.js
│   ├── .env                       # Variables de entorno (ignorado en Git)
│   └── server.js                  # Punto de entrada del servidor
├── database/
│   └── schema_supabase.sql        # Esquema PostgreSQL + datos semilla
├── frontend/
│   ├── css/
│   │   └── style.css              # Estilos globales (tema oscuro)
│   ├── js/
│   │   ├── api.js                 # Capa de comunicación dinámica con la API
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
├── package.json
└── README.md
```

---

## ⚙️ Requisitos Previos

- [Node.js](https://nodejs.org/) v18+
- Git
- Una cuenta en [Supabase](https://supabase.com) (para la base de datos)
- Una cuenta en [Render](https://render.com) (para el despliegue)

---

## 💻 Instalación Local

### 1. Clonar el repositorio

```bash
git clone https://github.com/Yamilwz/billar_reservas.git
cd billar_reservas
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar base de datos en Supabase

1. Crea un proyecto en Supabase.
2. Ve al **SQL Editor** y ejecuta el contenido completo del archivo `database/schema_supabase.sql`.
3. Ve a la configuración de base de datos en Supabase y obtén tu **Connection Pooler URL** (importante para compatibilidad IPv4).

### 4. Configurar variables de entorno

Crea un archivo `.env` en la carpeta `backend/` con el siguiente contenido:

```env
PORT=3000
DATABASE_URL=postgresql://postgres.tu_id:tu_password@aws-0-region.pooler.supabase.com:6543/postgres
JWT_SECRET=super_secret_jwt_key_billar_123
```
*(Nota: Reemplaza `DATABASE_URL` con la URL real de tu Connection Pooler de Supabase. Recuerda que si tu contraseña tiene el símbolo `@`, debes escribirlo como `%40` en la URL).*

### 5. Iniciar el servidor

```bash
npm start
```

El sistema estará disponible en: **http://localhost:3000**

---

## 🚀 Despliegue en Producción (Render + Supabase)

El sistema está preparado para ser desplegado fácilmente en **Render**:

1. Crea un **Web Service** en Render conectado a tu repositorio de GitHub.
2. Configuración:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
3. En **Environment Variables**, agrega:
   - `DATABASE_URL`: La URL del Connection Pooler de Supabase (ej: `postgresql://postgres.[id]:[pass]@...:6543/postgres`)
   - `JWT_SECRET`: Tu clave secreta (ej: `super_secret_jwt_key_billar_123`)
4. Haz clic en **Deploy**. El frontend y backend se servirán automáticamente desde la misma URL de Render.

---

## 🗄️ Base de Datos

### Tablas principales (PostgreSQL)

| Tabla         | Descripción                                      |
|---------------|--------------------------------------------------|
| `users`       | Usuarios con roles `admin` y `cliente`           |
| `tables`      | Mesas de billar con estado y precio/hora         |
| `reservations`| Reservas vinculadas a usuario y mesa             |
| `products`    | Catálogo de productos del bar/tienda             |
| `sales`       | Cabecera de ventas POS usando transacciones nativas |
| `sale_items`  | Detalle de productos por venta                   |

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
| GET    | `/api/tables`      | Público| Listar todas las mesas   |
| PUT    | `/api/tables/:id`  | Admin  | Actualizar estado/precio |

### Reservas
| Método | Ruta                     | Acceso | Descripción                    |
|--------|--------------------------|--------|--------------------------------|
| GET    | `/api/reservations`      | Admin  | Todas las reservas             |
| GET    | `/api/reservations/slots`| Público| Horarios ocupados por fecha    |
| GET    | `/api/reservations/my-reservations` | Auth | Reservas del usuario actual |
| POST   | `/api/reservations`      | Auth   | Crear reserva                  |
| PUT    | `/api/reservations/:id`  | Admin  | Actualizar estado de reserva   |

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
| GET    | `/api/sales/daily` | Admin | Historial de ventas y totales |

---

## 🔑 Credenciales por Defecto

Después de ejecutar el esquema SQL en Supabase, se creará el siguiente administrador por defecto:

| Rol   | Email              | Contraseña |
|-------|--------------------|------------|
| Admin | admin@billar.com   | admin123   |

> ⚠️ **Importante:** Cambia la contraseña del administrador y el valor de `JWT_SECRET` en producción para mantener el sistema seguro.
