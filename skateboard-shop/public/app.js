// Estado de la aplicación
let currentUser = null;
let currentToken = null;
let editingProductId = null;
let cartItems = [];
let productsCache = null;
let cartCount = 0;

// Elementos del DOM
const loginView = document.getElementById('login-view');
const registerView = document.getElementById('register-view');
const productsView = document.getElementById('products-view');
const cartView = document.getElementById('cart-view');
const adminView = document.getElementById('admin-view');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const productForm = document.getElementById('product-form');
const logoutBtn = document.getElementById('logout-btn');
const userInfo = document.getElementById('user-info');
const addProductBtn = document.getElementById('add-product-btn');
const productFormContainer = document.getElementById('product-form-container');
const cancelFormBtn = document.getElementById('cancel-form-btn');
const productModal = document.getElementById('product-modal');
const closeModal = document.querySelector('.close-modal');
const cartIconBtn = document.getElementById('cart-icon-btn');
const cartIconContainer = document.getElementById('cart-icon-container');
const cartCountElement = document.getElementById('cart-count');
const cartItemsList = document.getElementById('cart-items-list');
const cartEmpty = document.getElementById('cart-empty');
const clearCartBtn = document.getElementById('clear-cart-btn');
const loadingOverlay = document.getElementById('loading-overlay');

// API Base URL - Se detecta automáticamente el entorno
// En desarrollo: http://localhost:3000/api
// En producción: usar la URL de tu backend desplegado
const API_URL = (() => {
    // Si estamos en localhost, usar localhost
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:3000/api';
    }
    // Si estamos en GitHub Pages o producción, usar la URL del backend
    // ⚠️ IMPORTANTE: CAMBIA ESTA URL por la URL de tu backend desplegado (Railway, Render, etc.)
    // Ejemplo: 'https://skateboard-shop-production.up.railway.app/api'
    return 'https://tu-backend.railway.app/api'; // ⚠️ CAMBIAR ESTA URL
})();

// Función helper para obtener la URL base (sin /api)
function getBaseUrl() {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:3000';
    }
    return API_URL.replace('/api', '');
}

// Utilidad de debounce para optimización
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    setupEventListeners();
});

// Verificar autenticación
async function checkAuth() {
    const token = localStorage.getItem('token');
    if (token) {
        try {
            const response = await fetch(`${API_URL}/verify`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                currentUser = data.user;
                currentToken = token;
                showViewByRole();
            } else {
                localStorage.removeItem('token');
                showView('login');
            }
        } catch (error) {
            console.error('Error verificando autenticación:', error);
            localStorage.removeItem('token');
            showView('login');
        }
    } else {
        showView('login');
    }
}

// Configurar event listeners
function setupEventListeners() {
    // Login
    loginForm.addEventListener('submit', handleLogin);
    document.getElementById('switch-to-register').addEventListener('click', (e) => {
        e.preventDefault();
        showView('register');
    });

    // Register
    registerForm.addEventListener('submit', handleRegister);
    document.getElementById('switch-to-login').addEventListener('click', (e) => {
        e.preventDefault();
        showView('login');
    });

    // Logout
    logoutBtn.addEventListener('click', handleLogout);

    // Cart
    cartIconBtn?.addEventListener('click', () => {
        if (currentUser && currentUser.role === 'comprador') {
            showView('cart');
            loadCart();
        }
    });

    clearCartBtn?.addEventListener('click', handleClearCart);

    // Image preview
    const productImagenInput = document.getElementById('product-imagen');
    const imagePreviewContainer = document.getElementById('image-preview-container');
    const imagePreview = document.getElementById('image-preview');
    const removeImageBtn = document.getElementById('remove-image-btn');

    productImagenInput?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          imagePreview.src = event.target.result;
          imagePreviewContainer.style.display = 'block';
        };
        reader.readAsDataURL(file);
      }
    });

    removeImageBtn?.addEventListener('click', () => {
      productImagenInput.value = '';
      imagePreviewContainer.style.display = 'none';
      imagePreview.src = '';
    });

    // Search functionality
    const searchInput = document.getElementById('search-input');
    const clearSearchBtn = document.getElementById('clear-search-btn');

    searchInput?.addEventListener('input', debounce((e) => {
      const searchTerm = e.target.value.trim();
      if (searchTerm) {
        clearSearchBtn.style.display = 'flex';
        searchProducts(searchTerm);
      } else {
        clearSearchBtn.style.display = 'none';
        loadProducts();
      }
    }, 300));

    clearSearchBtn?.addEventListener('click', () => {
      searchInput.value = '';
      clearSearchBtn.style.display = 'none';
      loadProducts();
    });

    // Admin
    addProductBtn?.addEventListener('click', () => {
        editingProductId = null;
        productForm.reset();
        document.getElementById('product-id').value = '';
        document.getElementById('form-title').textContent = 'Agregar Producto';
        productFormContainer.style.display = 'block';
        productFormContainer.scrollIntoView({ behavior: 'smooth' });
    });

    cancelFormBtn?.addEventListener('click', () => {
        productFormContainer.style.display = 'none';
        productForm.reset();
        editingProductId = null;
        // Limpiar preview de imagen
        const imagePreviewContainer = document.getElementById('image-preview-container');
        const productImagenInput = document.getElementById('product-imagen');
        if (imagePreviewContainer && productImagenInput) {
            imagePreviewContainer.style.display = 'none';
            productImagenInput.value = '';
        }
    });

    productForm?.addEventListener('submit', handleProductSubmit);

    // Modal
    closeModal?.addEventListener('click', () => {
        productModal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === productModal) {
            productModal.style.display = 'none';
        }
    });
}

// Mostrar vista según rol
function showViewByRole() {
    if (currentUser.role === 'admin') {
        showView('admin');
        loadAdminProducts();
    } else {
        showView('products');
        loadProducts();
    }
    updateNavbar();
}

// Mostrar vista específica
function showView(viewName) {
    loginView.classList.remove('active');
    registerView.classList.remove('active');
    productsView.classList.remove('active');
    cartView.classList.remove('active');
    adminView.classList.remove('active');

    switch(viewName) {
        case 'login':
            loginView.classList.add('active');
            break;
        case 'register':
            registerView.classList.add('active');
            break;
        case 'products':
            productsView.classList.add('active');
            break;
        case 'cart':
            cartView.classList.add('active');
            break;
        case 'admin':
            adminView.classList.add('active');
            break;
    }
}

// Hacer showView global para uso en HTML
window.showView = showView;

// Actualizar navbar
function updateNavbar() {
    if (currentUser) {
        userInfo.textContent = `👤 ${currentUser.username} (${currentUser.role})`;
        logoutBtn.style.display = 'block';
        
        // Mostrar carrito solo para compradores
        if (currentUser.role === 'comprador') {
            cartIconContainer.style.display = 'block';
            loadCartCount();
        } else {
            cartIconContainer.style.display = 'none';
        }
    } else {
        userInfo.textContent = '';
        logoutBtn.style.display = 'none';
        cartIconContainer.style.display = 'none';
    }
}

// Manejar login
async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            currentToken = data.token;
            currentUser = data.user;
            localStorage.setItem('token', data.token);
            productsCache = null; // Limpiar caché al cambiar de usuario
            showNotification('Login exitoso', 'success');
            showViewByRole();
        } else {
            showNotification(data.error || 'Error al iniciar sesión', 'error');
        }
    } catch (error) {
        showNotification('Error de conexión', 'error');
        console.error('Error:', error);
    }
}

// Manejar registro
async function handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById('register-username').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;

    try {
        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, email, password })
        });

        const data = await response.json();

        if (response.ok) {
            currentToken = data.token;
            currentUser = data.user;
            localStorage.setItem('token', data.token);
            productsCache = null; // Limpiar caché al cambiar de usuario
            showNotification('Cuenta creada exitosamente', 'success');
            showViewByRole();
        } else {
            showNotification(data.error || 'Error al crear cuenta', 'error');
        }
    } catch (error) {
        showNotification('Error de conexión', 'error');
        console.error('Error:', error);
    }
}

// Manejar logout
function handleLogout() {
    currentUser = null;
    currentToken = null;
    cartItems = [];
    cartCount = 0;
    productsCache = null;
    localStorage.removeItem('token');
    showView('login');
    updateNavbar();
    showNotification('Sesión cerrada', 'info');
}

// Cargar productos (comprador) - Optimizado con caché
async function loadProducts() {
    // Usar caché si está disponible
    if (productsCache) {
        displayProducts(productsCache, 'products-grid');
        document.getElementById('no-results').style.display = 'none';
        return;
    }

    try {
        const response = await fetch(`${API_URL}/products`, {
            headers: {
                'Authorization': `Bearer ${currentToken}`
            }
        });

        if (response.ok) {
            const products = await response.json();
            productsCache = products; // Guardar en caché
            displayProducts(products, 'products-grid');
            document.getElementById('no-results').style.display = 'none';
        } else {
            showNotification('Error al cargar productos', 'error');
        }
    } catch (error) {
        showNotification('Error de conexión', 'error');
        console.error('Error:', error);
    }
}

// Buscar productos
async function searchProducts(searchTerm) {
    try {
        const response = await fetch(`${API_URL}/products?search=${encodeURIComponent(searchTerm)}`, {
            headers: {
                'Authorization': `Bearer ${currentToken}`
            }
        });

        if (response.ok) {
            const products = await response.json();
            const noResults = document.getElementById('no-results');
            
            if (products.length === 0) {
                noResults.style.display = 'block';
            } else {
                noResults.style.display = 'none';
            }
            displayProducts(products, 'products-grid');
        } else {
            showNotification('Error al buscar productos', 'error');
        }
    } catch (error) {
        showNotification('Error de conexión', 'error');
        console.error('Error:', error);
    }
}

// Cargar productos (admin)
async function loadAdminProducts() {
    try {
        const response = await fetch(`${API_URL}/products`, {
            headers: {
                'Authorization': `Bearer ${currentToken}`
            }
        });

        if (response.ok) {
            const products = await response.json();
            displayAdminProducts(products);
        } else {
            showNotification('Error al cargar productos', 'error');
        }
    } catch (error) {
        showNotification('Error de conexión', 'error');
        console.error('Error:', error);
    }
}

// Mostrar productos - Optimizado con DocumentFragment
function displayProducts(products, containerId) {
    const container = document.getElementById(containerId);
    
    if (products.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: white; font-size: 1.2rem;">No hay productos disponibles</p>';
        return;
    }

    // Usar DocumentFragment para mejor rendimiento
    const fragment = document.createDocumentFragment();
    products.forEach(product => {
        const productCard = createProductCard(product);
        fragment.appendChild(productCard);
    });
    
    container.innerHTML = '';
    container.appendChild(fragment);
}

// Crear tarjeta de producto - Optimizado con lazy loading
function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    
    const imageUrl = product.imagen 
        ? `${getBaseUrl()}/uploads/${product.imagen}` 
        : null;

    const isComprador = currentUser && currentUser.role === 'comprador';

    card.innerHTML = `
        <div class="product-image">
            ${imageUrl 
                ? `<img src="${imageUrl}" alt="${product.titulo}" loading="lazy" onerror="this.parentElement.innerHTML='🛹'">` 
                : '🛹'}
        </div>
        <div class="product-info">
            <h3 class="product-title">${product.titulo}</h3>
            <p class="product-detail">${product.detalle}</p>
            <div class="product-price-quantity">
                <span class="product-price">$${parseFloat(product.precio || 0).toFixed(2)}</span>
                <span class="product-quantity">Stock: ${product.cantidad}</span>
            </div>
            ${isComprador && product.cantidad > 0 
                ? `<button class="btn-add-cart" onclick="event.stopPropagation(); addToCart(${product.id})">Agregar al Carrito</button>`
                : ''}
        </div>
    `;

    card.addEventListener('click', () => {
        showProductModal(product);
    });

    return card;
}

// Mostrar productos admin
function displayAdminProducts(products) {
    const container = document.getElementById('admin-products-grid');
    container.innerHTML = '';

    if (products.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: white; font-size: 1.2rem;">No hay productos. Agrega uno nuevo.</p>';
        return;
    }

    products.forEach(product => {
        const productCard = createAdminProductCard(product);
        container.appendChild(productCard);
    });
}

// Crear tarjeta de producto admin
function createAdminProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    
    const imageUrl = product.imagen 
        ? `${getBaseUrl()}/uploads/${product.imagen}` 
        : null;

    card.innerHTML = `
        <div class="product-image">
            ${imageUrl 
                ? `<img src="${imageUrl}" alt="${product.titulo}" onerror="this.parentElement.innerHTML='🛹'">` 
                : '🛹'}
        </div>
        <div class="product-info">
            <h3 class="product-title">${product.titulo}</h3>
            <p class="product-detail">${product.detalle}</p>
            <div class="product-price-quantity">
                <span class="product-price">$${parseFloat(product.precio || 0).toFixed(2)}</span>
                <span class="product-quantity">Stock: ${product.cantidad}</span>
            </div>
            <div class="admin-actions">
                <button class="btn-edit" onclick="editProduct(${product.id})">Editar</button>
                <button class="btn-delete" onclick="deleteProduct(${product.id})">Eliminar</button>
            </div>
        </div>
    `;

    return card;
}

// Editar producto
window.editProduct = async function(productId) {
    try {
        const response = await fetch(`${API_URL}/products`, {
            headers: {
                'Authorization': `Bearer ${currentToken}`
            }
        });

        if (response.ok) {
            const products = await response.json();
            const product = products.find(p => p.id === productId);
            
            if (product) {
                editingProductId = productId;
                document.getElementById('product-id').value = productId;
                document.getElementById('product-titulo').value = product.titulo;
                document.getElementById('product-detalle').value = product.detalle;
                document.getElementById('product-cantidad').value = product.cantidad;
                document.getElementById('product-precio').value = product.precio || 0;
                document.getElementById('form-title').textContent = 'Editar Producto';
                
                // Limpiar preview de imagen al editar
                const imagePreviewContainer = document.getElementById('image-preview-container');
                const productImagenInput = document.getElementById('product-imagen');
                if (imagePreviewContainer && productImagenInput) {
                    imagePreviewContainer.style.display = 'none';
                    productImagenInput.value = '';
                }
                
                productFormContainer.style.display = 'block';
                productFormContainer.scrollIntoView({ behavior: 'smooth' });
            }
        }
    } catch (error) {
        showNotification('Error al cargar producto', 'error');
        console.error('Error:', error);
    }
};

// Eliminar producto
window.deleteProduct = async function(productId) {
    if (!confirm('¿Estás seguro de eliminar este producto?')) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/products/${productId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${currentToken}`
            }
        });

        if (response.ok) {
            showNotification('Producto eliminado exitosamente', 'success');
            productsCache = null; // Invalidar caché
            loadAdminProducts();
        } else {
            const data = await response.json();
            showNotification(data.error || 'Error al eliminar producto', 'error');
        }
    } catch (error) {
        showNotification('Error de conexión', 'error');
        console.error('Error:', error);
    }
};

// Manejar envío de formulario de producto
async function handleProductSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('titulo', document.getElementById('product-titulo').value);
    formData.append('detalle', document.getElementById('product-detalle').value);
    formData.append('cantidad', document.getElementById('product-cantidad').value);
    formData.append('precio', document.getElementById('product-precio').value);
    
    const imagenInput = document.getElementById('product-imagen');
    if (imagenInput.files[0]) {
        formData.append('imagen', imagenInput.files[0]);
    }

    const url = editingProductId 
        ? `${API_URL}/products/${editingProductId}`
        : `${API_URL}/products`;
    
    const method = editingProductId ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method: method,
            headers: {
                'Authorization': `Bearer ${currentToken}`
            },
            body: formData
        });

        const data = await response.json();

        if (response.ok) {
            showNotification(
                editingProductId ? 'Producto actualizado exitosamente' : 'Producto creado exitosamente',
                'success'
            );
            productForm.reset();
            // Limpiar preview de imagen
            const imagePreviewContainer = document.getElementById('image-preview-container');
            if (imagePreviewContainer) {
                imagePreviewContainer.style.display = 'none';
            }
            productFormContainer.style.display = 'none';
            editingProductId = null;
            productsCache = null; // Invalidar caché
            loadAdminProducts();
        } else {
            showNotification(data.error || 'Error al guardar producto', 'error');
        }
    } catch (error) {
        showNotification('Error de conexión', 'error');
        console.error('Error:', error);
    }
}

// Mostrar modal de producto
function showProductModal(product) {
    const modalBody = document.getElementById('modal-body');
    const imageUrl = product.imagen 
        ? `${getBaseUrl()}/uploads/${product.imagen}` 
        : null;

    const isComprador = currentUser && currentUser.role === 'comprador';

    modalBody.innerHTML = `
        ${imageUrl 
            ? `<img src="${imageUrl}" alt="${product.titulo}" class="modal-product-image" loading="lazy" onerror="this.style.display='none'">` 
            : ''}
        <h2 class="modal-product-title">${product.titulo}</h2>
        <p class="modal-product-detail">${product.detalle}</p>
        <div class="modal-product-info">
            <span class="modal-product-price">$${parseFloat(product.precio || 0).toFixed(2)}</span>
            <span class="modal-product-quantity">Stock disponible: ${product.cantidad}</span>
        </div>
        ${isComprador && product.cantidad > 0 
            ? `<button class="btn-primary" style="margin-top: 1rem; width: auto;" onclick="addToCart(${product.id}); productModal.style.display='none';">Agregar al Carrito</button>`
            : ''}
    `;

    productModal.style.display = 'block';
}

// Mostrar notificación
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.style.display = 'block';

    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

// Funciones del carrito
async function loadCart() {
    if (!currentUser || currentUser.role !== 'comprador') return;

    document.getElementById('cart-loading').style.display = 'block';
    cartItemsList.innerHTML = '';
    cartEmpty.style.display = 'none';

    try {
        const response = await fetch(`${API_URL}/cart`, {
            headers: {
                'Authorization': `Bearer ${currentToken}`
            }
        });

        if (response.ok) {
            cartItems = await response.json();
            document.getElementById('cart-loading').style.display = 'none';
            
            if (cartItems.length === 0) {
                cartEmpty.style.display = 'block';
                clearCartBtn.style.display = 'none';
            } else {
                displayCartItems();
                clearCartBtn.style.display = 'block';
            }
            updateCartCount();
        } else {
            showNotification('Error al cargar carrito', 'error');
            document.getElementById('cart-loading').style.display = 'none';
        }
    } catch (error) {
        showNotification('Error de conexión', 'error');
        document.getElementById('cart-loading').style.display = 'none';
        console.error('Error:', error);
    }
}

function displayCartItems() {
    const fragment = document.createDocumentFragment();
    
    cartItems.forEach(item => {
        const cartItem = createCartItemElement(item);
        fragment.appendChild(cartItem);
    });
    
    cartItemsList.innerHTML = '';
    cartItemsList.appendChild(fragment);
}

function createCartItemElement(item) {
    const div = document.createElement('div');
    div.className = 'cart-item';
    
    const imageUrl = item.imagen 
        ? `${getBaseUrl()}/uploads/${item.imagen}` 
        : null;

    const precioUnitario = parseFloat(item.precio || 0);
    const precioTotal = precioUnitario * item.quantity;

    div.innerHTML = `
        <div class="cart-item-image">
            ${imageUrl 
                ? `<img src="${imageUrl}" alt="${item.titulo}" loading="lazy" onerror="this.parentElement.innerHTML='🛹'">` 
                : '🛹'}
        </div>
        <div class="cart-item-info">
            <h3 class="cart-item-title">${item.titulo}</h3>
            <p class="cart-item-detail">${item.detalle}</p>
            <div class="cart-item-price-info">
                <span class="cart-item-price-unit">Precio unitario: $${precioUnitario.toFixed(2)}</span>
                <span class="cart-item-stock">Stock disponible: ${item.stock}</span>
            </div>
        </div>
        <div class="cart-item-actions">
            <div class="cart-item-quantity">
                <button class="quantity-btn" onclick="updateCartQuantity(${item.id}, ${item.quantity - 1})">-</button>
                <input type="number" class="quantity-input" value="${item.quantity}" min="1" max="${item.stock}" 
                       onchange="updateCartQuantity(${item.id}, parseInt(this.value))">
                <button class="quantity-btn" onclick="updateCartQuantity(${item.id}, ${item.quantity + 1})">+</button>
            </div>
            <div class="cart-item-total">
                <span class="cart-item-total-label">Total:</span>
                <span class="cart-item-total-price">$${precioTotal.toFixed(2)}</span>
            </div>
            <button class="cart-item-remove" onclick="removeFromCart(${item.id})">Eliminar</button>
        </div>
    `;

    return div;
}

// Hacer funciones globales para uso en HTML
window.addToCart = async function(productId) {
    if (!currentUser || currentUser.role !== 'comprador') {
        showNotification('Debes iniciar sesión como comprador', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/cart`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${currentToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ product_id: productId, quantity: 1 })
        });

        const data = await response.json();

        if (response.ok) {
            showNotification('Producto agregado al carrito', 'success');
            loadCartCount();
            // Invalidar caché de productos para reflejar cambios de stock
            productsCache = null;
        } else {
            showNotification(data.error || 'Error al agregar al carrito', 'error');
        }
    } catch (error) {
        showNotification('Error de conexión', 'error');
        console.error('Error:', error);
    }
};

window.updateCartQuantity = async function(cartId, quantity) {
    if (quantity < 1) {
        removeFromCart(cartId);
        return;
    }

    const item = cartItems.find(i => i.id === cartId);
    if (item && quantity > item.stock) {
        showNotification('Stock insuficiente', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/cart/${cartId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${currentToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ quantity })
        });

        if (response.ok) {
            loadCart();
        } else {
            const data = await response.json();
            showNotification(data.error || 'Error al actualizar cantidad', 'error');
        }
    } catch (error) {
        showNotification('Error de conexión', 'error');
        console.error('Error:', error);
    }
};

window.removeFromCart = async function(cartId) {
    try {
        const response = await fetch(`${API_URL}/cart/${cartId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${currentToken}`
            }
        });

        if (response.ok) {
            showNotification('Producto eliminado del carrito', 'success');
            loadCart();
            loadCartCount();
        } else {
            const data = await response.json();
            showNotification(data.error || 'Error al eliminar del carrito', 'error');
        }
    } catch (error) {
        showNotification('Error de conexión', 'error');
        console.error('Error:', error);
    }
};

async function handleClearCart() {
    if (!confirm('¿Estás seguro de vaciar el carrito?')) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/cart`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${currentToken}`
            }
        });

        if (response.ok) {
            showNotification('Carrito vaciado', 'success');
            loadCart();
            loadCartCount();
        } else {
            const data = await response.json();
            showNotification(data.error || 'Error al vaciar carrito', 'error');
        }
    } catch (error) {
        showNotification('Error de conexión', 'error');
        console.error('Error:', error);
    }
}

async function loadCartCount() {
    if (!currentUser || currentUser.role !== 'comprador') return;

    try {
        const response = await fetch(`${API_URL}/cart`, {
            headers: {
                'Authorization': `Bearer ${currentToken}`
            }
        });

        if (response.ok) {
            const items = await response.json();
            cartCount = items.reduce((sum, item) => sum + item.quantity, 0);
            cartCountElement.textContent = cartCount;
        }
    } catch (error) {
        console.error('Error al cargar contador del carrito:', error);
    }
}

