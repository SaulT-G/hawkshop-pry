// filepath: c:\skateboard-shop\public\js\events.js
/**
 * Módulo de configuración de event listeners
 */

import { elements, debounce, showView } from './ui.js';
import { handleLogin, handleRegister, handleLogout } from './auth.js';
import { loadProducts, searchProducts, handleProductSubmit } from './products.js';
import { loadCart, handleClearCart, loadCartCount } from './cart.js';
import { getUser, setEditingProductId } from './state.js';
import { MAX_STOCK, MAX_PRICE } from './config.js';
import { showNotification } from './ui.js';

/**
 * Configurar todos los event listeners
 */
export function setupEventListeners() {
    setupAuthListeners();
    setupNavigationListeners();
    setupCartListeners();
    setupAdminListeners();
    setupSearchListeners();
    setupModalListeners();
    setupProductFormValidation();
}

/**
 * Event listeners de autenticación
 */
function setupAuthListeners() {
    elements.loginForm.addEventListener('submit', handleLogin);

    document.getElementById('switch-to-register').addEventListener('click', (e) => {
        e.preventDefault();
        showView('register');
    });

    elements.registerForm.addEventListener('submit', handleRegister);

    document.getElementById('switch-to-login').addEventListener('click', (e) => {
        e.preventDefault();
        showView('login');
    });

    elements.logoutBtn.addEventListener('click', handleLogout);
}

/**
 * Event listeners de navegación
 */
function setupNavigationListeners() {
    elements.backToMainBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        showView('products');
        loadProducts();
    });
}

/**
 * Event listeners del carrito
 */
function setupCartListeners() {
    elements.cartIconBtn?.addEventListener('click', () => {
        const currentUser = getUser();
        if (currentUser && currentUser.role === 'comprador') {
            showView('cart');
            loadCart();
        }
    });

    elements.clearCartBtn?.addEventListener('click', handleClearCart);
}

/**
 * Event listeners de admin
 */
function setupAdminListeners() {
    elements.addProductBtn?.addEventListener('click', () => {
        setEditingProductId(null);
        elements.productForm.reset();
        document.getElementById('product-id').value = '';
        document.getElementById('form-title').textContent = 'Agregar Producto';
        elements.productFormContainer.style.display = 'block';
        elements.productFormContainer.scrollIntoView({ behavior: 'smooth' });
        elements.backToMainBtn.style.display = 'block';
    });

    elements.cancelFormBtn?.addEventListener('click', () => {
        elements.productFormContainer.style.display = 'none';
        elements.productForm.reset();
        setEditingProductId(null);

        // Limpiar preview de imagen
        const imagePreviewContainer = document.getElementById('image-preview-container');
        const productImagenInput = document.getElementById('product-imagen');
        if (imagePreviewContainer && productImagenInput) {
            imagePreviewContainer.style.display = 'none';
            productImagenInput.value = '';
        }

        const currentUser = getUser();
        if (currentUser && currentUser.role === 'admin') {
            elements.backToMainBtn.style.display = 'none';
        }
    });

    elements.productForm?.addEventListener('submit', handleProductSubmit);

    // Image preview
    setupImagePreview();
}

/**
 * Event listeners de búsqueda
 */
function setupSearchListeners() {
    elements.searchInput?.addEventListener('input', debounce((e) => {
        const searchTerm = e.target.value.trim();
        if (searchTerm) {
            elements.clearSearchBtn.style.display = 'flex';
            searchProducts(searchTerm);
        } else {
            elements.clearSearchBtn.style.display = 'none';
            loadProducts();
        }
    }, 300));

    elements.clearSearchBtn?.addEventListener('click', () => {
        elements.searchInput.value = '';
        elements.clearSearchBtn.style.display = 'none';
        loadProducts();
    });
}

/**
 * Event listeners del modal
 */
function setupModalListeners() {
    elements.closeModal?.addEventListener('click', () => {
        elements.productModal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === elements.productModal) {
            elements.productModal.style.display = 'none';
        }
    });
}

/**
 * Configurar preview de imagen
 */
function setupImagePreview() {
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
}

/**
 * Validación de formulario de productos
 */
function setupProductFormValidation() {
    const productCantidadInput = document.getElementById('product-cantidad');
    const productPrecioInput = document.getElementById('product-precio');

    productCantidadInput?.addEventListener('input', (e) => {
        const el = e.target;
        let v = parseInt(el.value, 10);
        if (isNaN(v)) return;
        if (v < 0) {
            el.value = 0;
            return;
        }
        if (v > MAX_STOCK) {
            el.value = MAX_STOCK;
            showNotification(`Cantidad máxima ${MAX_STOCK}`, 'error');
        }
    });

    productPrecioInput?.addEventListener('input', (e) => {
        const el = e.target;
        let v = parseFloat(el.value);
        if (isNaN(v)) return;
        if (v < 0) {
            el.value = 0;
            return;
        }
        if (v > MAX_PRICE) {
            el.value = MAX_PRICE;
            showNotification(`Precio máximo $${MAX_PRICE.toFixed(2)}`, 'error');
        }
    });
}

