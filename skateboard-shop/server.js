const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'skateboard-secret-key-2024';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Configuración de multer para subir imágenes
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes (jpeg, jpg, png, gif, webp)'));
    }
  }
});

// Inicializar base de datos con modo persistente
const db = new sqlite3.Database('skateboard.db', sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
  if (err) {
    console.error('Error al conectar con la base de datos:', err.message);
  } else {
    console.log('Conectado a la base de datos SQLite');
    // Habilitar WAL mode para mejor rendimiento y persistencia
    db.run('PRAGMA journal_mode = WAL;', (err) => {
      if (err) {
        console.error('Error al habilitar WAL mode:', err.message);
      } else {
        console.log('Modo WAL habilitado para mejor persistencia');
      }
    });
    // Habilitar foreign keys
    db.run('PRAGMA foreign_keys = ON;', (err) => {
      if (err) {
        console.error('Error al habilitar foreign keys:', err.message);
      }
    });
    // Configurar sincronización para asegurar persistencia
    db.run('PRAGMA synchronous = NORMAL;', (err) => {
      if (err) {
        console.error('Error al configurar synchronous:', err.message);
      }
    });
    initDatabase();
    
    // Hacer checkpoint periódico del WAL cada 30 segundos para asegurar persistencia
    setInterval(() => {
      db.run('PRAGMA wal_checkpoint(TRUNCATE);', (err) => {
        if (err) {
          console.error('Error en checkpoint WAL:', err.message);
        }
      });
    }, 30000); // Cada 30 segundos
  }
});

// Crear tablas
function initDatabase() {
  db.serialize(() => {
    // Tabla de usuarios
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'comprador',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Tabla de productos
    db.run(`CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      titulo TEXT NOT NULL,
      detalle TEXT NOT NULL,
      cantidad INTEGER NOT NULL,
      imagen TEXT,
      admin_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (admin_id) REFERENCES users(id)
    )`);

    // Tabla de carrito de compras
    db.run(`CREATE TABLE IF NOT EXISTS cart (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (product_id) REFERENCES products(id),
      UNIQUE(user_id, product_id)
    )`);

    // Crear índices para optimización
    db.run(`CREATE INDEX IF NOT EXISTS idx_cart_user ON cart(user_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_products_admin ON products(admin_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)`);

    // Crear usuario admin por defecto
    const adminPassword = bcrypt.hashSync('admin123', 10);
    db.run(`INSERT OR IGNORE INTO users (username, email, password, role) 
            VALUES ('admin', 'admin@skateboard.com', ?, 'admin')`, [adminPassword]);
  });
}

// Middleware de autenticación
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido' });
    }
    req.user = user;
    next();
  });
}

// Middleware para verificar rol admin
function isAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acceso denegado. Se requiere rol de administrador' });
  }
  next();
}

// Rutas de autenticación
app.post('/api/register', async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Todos los campos son requeridos' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    db.run(
      'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
      [username, email, hashedPassword, 'comprador'],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint')) {
            return res.status(400).json({ error: 'El usuario o email ya existe' });
          }
          return res.status(500).json({ error: 'Error al crear usuario' });
        }

        const token = jwt.sign(
          { id: this.lastID, username, email, role: 'comprador' },
          JWT_SECRET,
          { expiresIn: '24h' }
        );

        res.json({ 
          message: 'Usuario creado exitosamente',
          token,
          user: { id: this.lastID, username, email, role: 'comprador' }
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Error al procesar la solicitud' });
  }
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
  }

  db.get(
    'SELECT * FROM users WHERE username = ? OR email = ?',
    [username, username],
    async (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Error en la base de datos' });
      }

      if (!user) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }

      const token = jwt.sign(
        { id: user.id, username: user.username, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        message: 'Login exitoso',
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      });
    }
  );
});

// Ruta para verificar token
app.get('/api/verify', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

// Rutas de productos
// Obtener todos los productos (solo compradores y admin) - Optimizado con caché
let productsCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 30000; // 30 segundos

app.get('/api/products', authenticateToken, (req, res) => {
  const searchQuery = req.query.search;
  const now = Date.now();
  
  // Si hay búsqueda, no usar caché
  if (searchQuery && searchQuery.trim()) {
    const searchTerm = `%${searchQuery.trim()}%`;
    db.all(
      'SELECT * FROM products WHERE titulo LIKE ? ORDER BY created_at DESC',
      [searchTerm],
      (err, products) => {
        if (err) {
          return res.status(500).json({ error: 'Error al buscar productos' });
        }
        res.json(products);
      }
    );
    return;
  }
  
  // Usar caché si está disponible y no ha expirado
  if (productsCache && cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION) {
    return res.json(productsCache);
  }

  db.all('SELECT * FROM products ORDER BY created_at DESC', (err, products) => {
    if (err) {
      return res.status(500).json({ error: 'Error al obtener productos' });
    }
    // Actualizar caché
    productsCache = products;
    cacheTimestamp = now;
    res.json(products);
  });
});

// Crear producto (solo admin)
app.post('/api/products', authenticateToken, isAdmin, upload.single('imagen'), (req, res) => {
  const { titulo, detalle, cantidad } = req.body;
  const imagen = req.file ? req.file.filename : null;

  if (!titulo || !detalle || !cantidad) {
    return res.status(400).json({ error: 'Título, detalle y cantidad son requeridos' });
  }

  db.run(
    'INSERT INTO products (titulo, detalle, cantidad, imagen, admin_id) VALUES (?, ?, ?, ?, ?)',
    [titulo, detalle, parseInt(cantidad), imagen, req.user.id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Error al crear producto' });
      }

      // Invalidar caché
      productsCache = null;
      cacheTimestamp = null;
      
      res.json({
        message: 'Producto creado exitosamente',
        product: {
          id: this.lastID,
          titulo,
          detalle,
          cantidad: parseInt(cantidad),
          imagen
        }
      });
    }
  );
});

// Actualizar producto (solo admin)
app.put('/api/products/:id', authenticateToken, isAdmin, upload.single('imagen'), (req, res) => {
  const { id } = req.params;
  const { titulo, detalle, cantidad } = req.body;
  const imagen = req.file ? req.file.filename : null;

  let query = 'UPDATE products SET titulo = ?, detalle = ?, cantidad = ?';
  let params = [titulo, detalle, parseInt(cantidad)];

  if (imagen) {
    query += ', imagen = ?';
    params.push(imagen);
  }

  query += ' WHERE id = ?';
  params.push(id);

  db.run(query, params, function(err) {
    if (err) {
      return res.status(500).json({ error: 'Error al actualizar producto' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    // Invalidar caché
    productsCache = null;
    cacheTimestamp = null;
    res.json({ message: 'Producto actualizado exitosamente' });
  });
});

// Eliminar producto (solo admin)
app.delete('/api/products/:id', authenticateToken, isAdmin, (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM products WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Error al eliminar producto' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    // Invalidar caché
    productsCache = null;
    cacheTimestamp = null;
    res.json({ message: 'Producto eliminado exitosamente' });
  });
});

// Rutas de carrito de compras (solo compradores)
// Obtener carrito del usuario
app.get('/api/cart', authenticateToken, (req, res) => {
  const userId = req.user.id;

  db.all(
    `SELECT c.id, c.quantity, c.product_id, p.titulo, p.detalle, p.cantidad as stock, p.imagen
     FROM cart c
     INNER JOIN products p ON c.product_id = p.id
     WHERE c.user_id = ?
     ORDER BY c.created_at DESC`,
    [userId],
    (err, items) => {
      if (err) {
        return res.status(500).json({ error: 'Error al obtener carrito' });
      }
      res.json(items);
    }
  );
});

// Agregar producto al carrito
app.post('/api/cart', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const { product_id, quantity } = req.body;

  if (!product_id || !quantity || quantity < 1) {
    return res.status(400).json({ error: 'Producto y cantidad válida son requeridos' });
  }

  // Verificar que el producto existe y tiene stock
  db.get('SELECT cantidad FROM products WHERE id = ?', [product_id], (err, product) => {
    if (err) {
      return res.status(500).json({ error: 'Error al verificar producto' });
    }
    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    if (product.cantidad < quantity) {
      return res.status(400).json({ error: 'Stock insuficiente' });
    }

    // Verificar si el producto ya está en el carrito
    db.get('SELECT id, quantity FROM cart WHERE user_id = ? AND product_id = ?', 
      [userId, product_id], (err, existingItem) => {
        if (err) {
          return res.status(500).json({ error: 'Error al verificar carrito' });
        }

        if (existingItem) {
          // Actualizar cantidad
          const newQuantity = existingItem.quantity + quantity;
          if (newQuantity > product.cantidad) {
            return res.status(400).json({ error: 'Stock insuficiente para la cantidad solicitada' });
          }
          
          db.run('UPDATE cart SET quantity = ? WHERE id = ?', 
            [newQuantity, existingItem.id], function(err) {
              if (err) {
                return res.status(500).json({ error: 'Error al actualizar carrito' });
              }
              res.json({ message: 'Producto actualizado en el carrito', quantity: newQuantity });
            });
        } else {
          // Agregar nuevo item
          db.run('INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)',
            [userId, product_id, quantity], function(err) {
              if (err) {
                return res.status(500).json({ error: 'Error al agregar al carrito' });
              }
              res.json({ message: 'Producto agregado al carrito', id: this.lastID });
            });
        }
      });
  });
});

// Actualizar cantidad de un item en el carrito
app.put('/api/cart/:id', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const cartId = req.params.id;
  const { quantity } = req.body;

  if (!quantity || quantity < 1) {
    return res.status(400).json({ error: 'Cantidad válida es requerida' });
  }

  // Verificar que el item pertenece al usuario y obtener info del producto
  db.get(
    `SELECT c.product_id, p.cantidad as stock 
     FROM cart c 
     INNER JOIN products p ON c.product_id = p.id 
     WHERE c.id = ? AND c.user_id = ?`,
    [cartId, userId],
    (err, item) => {
      if (err) {
        return res.status(500).json({ error: 'Error al verificar item' });
      }
      if (!item) {
        return res.status(404).json({ error: 'Item no encontrado' });
      }
      if (quantity > item.stock) {
        return res.status(400).json({ error: 'Stock insuficiente' });
      }

      db.run('UPDATE cart SET quantity = ? WHERE id = ?', 
        [quantity, cartId], function(err) {
          if (err) {
            return res.status(500).json({ error: 'Error al actualizar carrito' });
          }
          res.json({ message: 'Carrito actualizado' });
        });
    }
  );
});

// Eliminar item del carrito
app.delete('/api/cart/:id', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const cartId = req.params.id;

  db.run('DELETE FROM cart WHERE id = ? AND user_id = ?', 
    [cartId, userId], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Error al eliminar del carrito' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Item no encontrado' });
      }
      res.json({ message: 'Producto eliminado del carrito' });
    });
});

// Vaciar carrito
app.delete('/api/cart', authenticateToken, (req, res) => {
  const userId = req.user.id;

  db.run('DELETE FROM cart WHERE user_id = ?', [userId], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Error al vaciar carrito' });
    }
    res.json({ message: 'Carrito vaciado' });
  });
});

// Función para cerrar la base de datos correctamente
function closeDatabase() {
  return new Promise((resolve) => {
    // Hacer checkpoint final del WAL antes de cerrar
    db.run('PRAGMA wal_checkpoint(FULL);', (checkpointErr) => {
      if (checkpointErr) {
        console.error('Error en checkpoint final:', checkpointErr.message);
      }
      // Cerrar la base de datos
      db.close((err) => {
        if (err) {
          console.error('Error al cerrar la base de datos:', err.message);
        } else {
          console.log('Base de datos cerrada correctamente. Datos guardados.');
        }
        resolve();
      });
    });
  });
}

// Cerrar base de datos correctamente al terminar el proceso
process.on('SIGINT', async () => {
  console.log('\nCerrando servidor...');
  await closeDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nCerrando servidor...');
  await closeDatabase();
  process.exit(0);
});

// Manejar errores no capturados
process.on('uncaughtException', async (err) => {
  console.error('Error no capturado:', err);
  await closeDatabase();
  process.exit(1);
});

// Manejar promesas rechazadas
process.on('unhandledRejection', async (reason, promise) => {
  console.error('Promesa rechazada no manejada:', reason);
  await closeDatabase();
  process.exit(1);
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
  console.log('Base de datos: skateboard.db (persistente)');
});

