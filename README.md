# SkateShop - Tienda de Skateboard

Tienda web de artículos de skateboard con sistema de autenticación y roles.

## Características

- 🛹 Diseño energético y llamativo
- 🔐 Sistema de autenticación (login y registro)
- 👥 Sistema de roles (Comprador y Admin)
- 📦 Gestión de productos (solo admin)
- 🖼️ Subida de imágenes para productos
- 💾 Base de datos SQLite

## Instalación

1. Instalar dependencias:
```bash
npm install
```

2. Iniciar el servidor:
```bash
npm start
```

Para desarrollo con auto-reload:
```bash
npm run dev
```

3. Abrir en el navegador:
```
http://localhost:3000
```

## Usuarios por defecto

**Admin:**
- Usuario: `admin`
- Contraseña: `admin123`

## Estructura del proyecto

```
skateboard-shop/
├── server.js          # Servidor Express
├── package.json       # Dependencias
├── skateboard.db      # Base de datos SQLite (se crea automáticamente)
├── uploads/           # Carpeta para imágenes (se crea automáticamente)
└── public/            # Frontend
    ├── index.html     # Página principal
    ├── styles.css     # Estilos
    └── app.js         # Lógica del frontend
```

## API Endpoints

### Autenticación
- `POST /api/register` - Registrar nuevo usuario
- `POST /api/login` - Iniciar sesión
- `GET /api/verify` - Verificar token

### Productos
- `GET /api/products` - Obtener todos los productos (requiere autenticación)
- `POST /api/products` - Crear producto (solo admin)
- `PUT /api/products/:id` - Actualizar producto (solo admin)
- `DELETE /api/products/:id` - Eliminar producto (solo admin)

## Roles

### Comprador
- Ver productos publicados
- Ver detalles de productos

### Admin
- Todas las funciones de comprador
- Crear productos
- Editar productos
- Eliminar productos
- Subir imágenes

## Tecnologías

- **Backend:** Node.js, Express
- **Base de datos:** SQLite3
- **Autenticación:** JWT (JSON Web Tokens)
- **Subida de archivos:** Multer
- **Frontend:** HTML5, CSS3, JavaScript (Vanilla)

