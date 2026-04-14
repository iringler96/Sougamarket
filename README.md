# Tienda online full stack - Alcoholes y Abarrotes

Proyecto base full stack con:

- **Frontend:** React + TypeScript + Vite + Material UI
- **Backend:** Node.js + Express + TypeScript
- **Base de datos:** PostgreSQL + Prisma
- **Módulos incluidos:**
  - autenticación con JWT
  - catálogo de productos
  - carrito de compra
  - creación de órdenes
  - control de stock
  - panel administrador
  - dashboard comercial
  - notificaciones de ventas

> **Importante:** esta base deja listo el flujo para tienda online real, pero el pago está simulado. La orden se marca como pagada para mostrar el flujo completo. La integración con Webpay u otro gateway sería la siguiente etapa.

---

## 1. Requisitos previos

Instala en tu equipo:

- **Node.js 20 o superior**
- **PostgreSQL**
- **npm**
- opcional: **Docker Desktop** si quieres levantar PostgreSQL con `docker-compose`

---

## 2. Estructura del proyecto

```bash
/tienda-online-fullstack
  /backend
  /frontend
  docker-compose.yml
  README.md
```

---

## 3. Levantar la base de datos

### Opción A: con Docker

Desde la carpeta raíz:

```bash
docker compose up -d
```

Esto levantará PostgreSQL en:

- host: `localhost`
- port: `5432`
- db: `tienda_online`
- user: `postgres`
- password: `postgres`

### Opción B: con PostgreSQL instalado localmente

Crea una base llamada:

```sql
CREATE DATABASE tienda_online;
```

---

## 4. Configurar el backend

Entra a la carpeta backend:

```bash
cd backend
```

Copia el archivo de variables de entorno:

```bash
cp .env.example .env
```

> En Windows PowerShell puedes usar:

```powershell
Copy-Item .env.example .env
```

Instala dependencias:

```bash
npm install
```

Genera Prisma Client:

```bash
npm run prisma:generate
```

Aplica migraciones:

```bash
npm run prisma:migrate
```

Carga datos demo:

```bash
npm run prisma:seed
```

Levanta el backend:

```bash
npm run dev
```

Backend disponible en:

```bash
http://localhost:4000
```

Prueba rápida:

```bash
http://localhost:4000/api/health
```

---

## 5. Configurar el frontend

Abre otra terminal y entra a la carpeta frontend:

```bash
cd frontend
```

Copia variables de entorno:

```bash
cp .env.example .env
```

> En Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Instala dependencias:

```bash
npm install
```

Levanta el frontend:

```bash
npm run dev
```

Frontend disponible en:

```bash
http://localhost:5173
```

---

## 6. Usuarios de prueba

### Administrador

- correo: `admin@tienda.cl`
- contraseña: `Admin123*`

### Cliente demo

- correo: `cliente@tienda.cl`
- contraseña: `Cliente123*`

---

## 7. Qué puedes probar

### Vista cliente

- entrar al catálogo
- buscar y filtrar productos
- agregar productos al carrito
- registrarte o iniciar sesión
- crear una orden
- revisar “Mis órdenes”

### Vista administrador

- entrar al panel `/admin`
- revisar dashboard comercial
- ver top productos vendidos
- revisar stock bajo
- crear y editar productos
- ajustar stock manualmente
- revisar órdenes
- cambiar estado de una orden

---

## 8. Endpoints principales del backend

### Públicos

- `GET /api/health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/products`
- `GET /api/products/categories`
- `GET /api/products/:id`

### Cliente autenticado

- `GET /api/auth/me`
- `GET /api/orders`
- `POST /api/orders`

### Administrador

- `GET /api/admin/dashboard`
- `GET /api/admin/products`
- `POST /api/admin/products`
- `PUT /api/admin/products/:id`
- `PATCH /api/admin/products/:id/stock`
- `GET /api/admin/orders`
- `PATCH /api/admin/orders/:id/status`
- `GET /api/admin/notifications`
- `PATCH /api/admin/notifications/:id/read`

---

## 9. Siguiente fase recomendada

Después de validar esta base, te recomiendo agregar:

1. **Webpay / Transbank**
2. **Subida real de imágenes** con Cloudinary o S3
3. **Direcciones múltiples por cliente**
4. **Despacho por comuna**
5. **Cupones y promociones**
6. **Carga masiva de productos por Excel**
7. **Auditoría de cambios**
8. **Dashboard con gráficos reales**
9. **Validación reforzada para venta de alcohol (+18)**

---

## 10. Flujo recomendado para desarrollar

1. levanta base de datos
2. corre backend
3. corre frontend
4. prueba login admin
5. crea productos nuevos
6. compra como cliente
7. revisa órdenes en admin
8. ajusta stock y verifica dashboard

---

## 11. Si algo falla

### Error de conexión a PostgreSQL
Revisa que `DATABASE_URL` en `backend/.env` coincida con tu base real.

### Error de Prisma
Vuelve a correr:

```bash
npm run prisma:generate
npm run prisma:migrate
```

### El frontend no carga datos
Asegúrate de que el backend esté corriendo en `http://localhost:4000`.

### CORS
Revisa que `FRONTEND_URL` en `backend/.env` sea:

```env
FRONTEND_URL=http://localhost:5173
```

---

## 12. Producción

Cuando quieras subirlo a internet, la arquitectura recomendada es:

- **frontend:** Vercel o Netlify
- **backend:** Render, Railway, VPS o Docker
- **base de datos:** PostgreSQL administrado
- **imágenes:** Cloudinary o S3

