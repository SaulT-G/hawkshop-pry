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
app.use(express.json({ limit: '10mb' })); // Limitar tamaño de JSON
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Función para sanitizar inputs y prevenir SQL injection
function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  // Eliminar caracteres potencialmente peligrosos
  return input.trim().replace(/[<>]/g, '');
}

// Función para validar que un valor sea un número entero positivo
function isValidPositiveInteger(value) {
  const num = parseInt(value);
  return Number.isInteger(num) && num > 0;
}

// Función para validar que un valor sea un número positivo (puede tener decimales)
function isValidPositiveNumber(value) {
  const num = parseFloat(value);
  return !isNaN(num) && num >= 0;
}

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

    // Agregar columna fullname si no existe
    db.all("PRAGMA table_info(users)", (err, columns) => {
      if (err) {
        console.error('Error al verificar columnas de usuarios:', err.message);
        return;
      }

      const hasFullnameColumn = columns.some(col => col.name === 'fullname');

      if (!hasFullnameColumn) {
        db.run(`ALTER TABLE users ADD COLUMN fullname TEXT`, (alterErr) => {
          if (alterErr) {
            console.error('Error al agregar columna fullname:', alterErr.message);
          } else {
            console.log('Columna fullname agregada exitosamente');
          }
        });
      }
    });

    // Agregar columna precio si no existe (ALTER TABLE)
    // SQLite no soporta IF NOT EXISTS en ALTER TABLE, así que verificamos primero
    db.all("PRAGMA table_info(products)", (err, columns) => {
      if (err) {
        console.error('Error al verificar columnas:', err.message);
        return;
      }
      
      const hasPrecioColumn = columns.some(col => col.name === 'precio');
      
      if (!hasPrecioColumn) {
        db.run(`ALTER TABLE products ADD COLUMN precio REAL DEFAULT 0.0`, (alterErr) => {
          if (alterErr) {
            console.error('Error al agregar columna precio:', alterErr.message);
          } else {
            console.log('Columna precio agregada exitosamente');
            // Asignar precio por defecto a productos existentes (solo si db está abierto)
            if (db && db.open) {
              db.run(`UPDATE products SET precio = 0.0 WHERE precio IS NULL`, (updateErr) => {
                if (updateErr && updateErr.code !== 'SQLITE_MISUSE') {
                  console.error('Error al actualizar precios existentes:', updateErr.message);
                } else if (!updateErr) {
                  console.log('Precios por defecto asignados a productos existentes');
                }
              });
            }
          }
        });
      } else {
        // La columna ya existe, asegurémonos de que los productos sin precio tengan 0.0
        if (db && db.open) {
          db.run(`UPDATE products SET precio = 0.0 WHERE precio IS NULL`, (updateErr) => {
            if (updateErr && updateErr.code !== 'SQLITE_MISUSE') {
              console.error('Error al actualizar precios existentes:', updateErr.message);
            }
          });
        }
      }
    });

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
  const { fullname, username, email, password } = req.body;

  // Validación de campos requeridos
  if (!fullname || !username || !email || !password) {
    return res.status(400).json({ error: 'Todos los campos son requeridos' });
  }

  // Validación de nombre completo
  if (fullname.trim().length < 3) {
    return res.status(400).json({ error: 'El nombre completo debe tener al menos 3 caracteres' });
  }

  // Validación de nombre de usuario
  if (username.trim().length < 3) {
    return res.status(400).json({ error: 'El nombre de usuario debe tener al menos 3 caracteres' });
  }

  // Validación de formato de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Por favor, ingresa un correo electrónico válido' });
  }

  // Validación de contraseña
  if (password.length < 8) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
  }

  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  if (!hasUpperCase || !hasLowerCase || !hasNumber) {
    return res.status(400).json({
      error: 'La contraseña debe contener al menos una mayúscula, una minúscula y un número'
    });
  }

  try {
    // Verificar si el email ya existe
    const existingEmail = await new Promise((resolve, reject) => {
      db.get('SELECT id FROM users WHERE email = ?', [email], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (existingEmail) {
      return res.status(400).json({
        error: 'Este correo electrónico ya está registrado. Por favor, elige otro'
      });
    }

    // Verificar si el username ya existe
    const existingUsername = await new Promise((resolve, reject) => {
      db.get('SELECT id FROM users WHERE username = ?', [username], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (existingUsername) {
      return res.status(400).json({
        error: 'Este nombre de usuario ya está en uso. Por favor, elige otro'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    db.run(
      'INSERT INTO users (fullname, username, email, password, role) VALUES (?, ?, ?, ?, ?)',
      [fullname.trim(), username.trim(), email.trim(), hashedPassword, 'comprador'],
      function(err) {
        if (err) {
          console.error('Error al crear usuario:', err);
          return res.status(500).json({ error: 'Error al crear usuario' });
        }

        res.json({
          message: 'Usuario creado exitosamente',
          user: {
            id: this.lastID,
            fullname: fullname.trim(),
            username: username.trim(),
            email: email.trim(),
            role: 'comprador'
          }
        });
      }
    );
  } catch (error) {
    console.error('Error en registro:', error);
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
  const { titulo, detalle, cantidad, precio } = req.body;
  const imagen = req.file ? req.file.filename : null;

  // Sanitizar inputs
  const sanitizedTitulo = sanitizeInput(titulo);
  const sanitizedDetalle = sanitizeInput(detalle);
  const sanitizedCantidad = sanitizeInput(cantidad);
  const sanitizedPrecio = sanitizeInput(precio);

  // Validar inputs
  if (!sanitizedTitulo || !sanitizedDetalle || !sanitizedCantidad || sanitizedPrecio === undefined) {
    return res.status(400).json({ error: 'Título, detalle, cantidad y precio son requeridos' });
  }

  if (!isValidPositiveInteger(sanitizedCantidad)) {
    return res.status(400).json({ error: 'La cantidad debe ser un número entero positivo' });
  }

  const precioNum = parseFloat(sanitizedPrecio);

  if (!isValidPositiveNumber(precioNum)) {
    return res.status(400).json({ error: 'El precio debe ser un número positivo' });
  }

  db.run(
    'INSERT INTO products (titulo, detalle, cantidad, precio, imagen, admin_id) VALUES (?, ?, ?, ?, ?, ?)',
    [sanitizedTitulo, sanitizedDetalle, parseInt(sanitizedCantidad), precioNum, imagen, req.user.id],
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
          titulo: sanitizedTitulo,
          detalle: sanitizedDetalle,
          cantidad: parseInt(sanitizedCantidad),
          precio: precioNum,
          imagen
        }
      });
    }
  );
});

// Actualizar producto (solo admin)
app.put('/api/products/:id', authenticateToken, isAdmin, upload.single('imagen'), (req, res) => {
  const { id } = req.params;
  const { titulo, detalle, cantidad, precio } = req.body;
  const imagen = req.file ? req.file.filename : null;

  // Sanitizar inputs
  const sanitizedTitulo = sanitizeInput(titulo);
  const sanitizedDetalle = sanitizeInput(detalle);
  const sanitizedCantidad = sanitizeInput(cantidad);
  const sanitizedPrecio = sanitizeInput(precio);

  // Validar inputs
  if (!sanitizedTitulo || !sanitizedDetalle || !sanitizedCantidad || sanitizedPrecio === undefined) {
    return res.status(400).json({ error: 'Título, detalle, cantidad y precio son requeridos' });
  }

  if (!isValidPositiveInteger(sanitizedCantidad)) {
    return res.status(400).json({ error: 'La cantidad debe ser un número entero positivo' });
  }

  const precioNum = parseFloat(sanitizedPrecio);

  if (!isValidPositiveNumber(precioNum)) {
    return res.status(400).json({ error: 'El precio debe ser un número positivo' });
  }

  let query = 'UPDATE products SET titulo = ?, detalle = ?, cantidad = ?, precio = ?';
  let params = [sanitizedTitulo, sanitizedDetalle, parseInt(sanitizedCantidad), precioNum];

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
    `SELECT c.id, c.quantity, c.product_id, p.titulo, p.detalle, p.cantidad as stock, p.precio, p.imagen
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

  // Sanitizar inputs
  const sanitizedProductId = sanitizeInput(product_id);
  const sanitizedQuantity = sanitizeInput(quantity);

  // Validar inputs
  if (!sanitizedProductId || !sanitizedQuantity || sanitizedQuantity < 1) {
    return res.status(400).json({ error: 'Producto y cantidad válida son requeridos' });
  }

  // Verificar que el producto existe y tiene stock
  db.get('SELECT cantidad FROM products WHERE id = ?', [sanitizedProductId], (err, product) => {
    if (err) {
      return res.status(500).json({ error: 'Error al verificar producto' });
    }
    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    if (product.cantidad < sanitizedQuantity) {
      return res.status(400).json({ error: 'Stock insuficiente' });
    }

    // Verificar si el producto ya está en el carrito
    db.get('SELECT id, quantity FROM cart WHERE user_id = ? AND product_id = ?',
      [userId, sanitizedProductId], (err, existingItem) => {
        if (err) {
          return res.status(500).json({ error: 'Error al verificar carrito' });
        }

        if (existingItem) {
          // Actualizar cantidad
          const newQuantity = existingItem.quantity + sanitizedQuantity;
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
            [userId, sanitizedProductId, sanitizedQuantity], function(err) {
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

  // Sanitizar inputs
  const sanitizedQuantity = sanitizeInput(quantity);

  // Validar inputs
  if (!sanitizedQuantity || sanitizedQuantity < 1) {
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
      if (sanitizedQuantity > item.stock) {
        return res.status(400).json({ error: 'Stock insuficiente' });
      }

      db.run('UPDATE cart SET quantity = ? WHERE id = ?',
        [sanitizedQuantity, cartId], function(err) {
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
        return res.status(500).json({ success: false, error: 'Error al eliminar del carrito' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ success: false, error: 'Item no encontrado' });
      }
      res.json({ success: true, message: 'Producto eliminado del carrito' });
    });
});

// Vaciar carrito
app.delete('/api/cart', authenticateToken, (req, res) => {
  const userId = req.user.id;

  db.run('DELETE FROM cart WHERE user_id = ?', [userId], function(err) {
    if (err) {
      return res.status(500).json({ success: false, error: 'Error al vaciar carrito' });
    }
    res.json({ success: true, message: 'Carrito vaciado' });
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
