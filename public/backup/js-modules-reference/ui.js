// filepath: c:\skateboard-shop\public\js\ui.js
/**
 * Módulo para gestión de UI y utilidades
 */

import { getUser, setCartCount } from './state.js';

// Elementos del DOM
export const elements = {
    // Vistas
    loginView: document.getElementById('login-view'),
    registerView: document.getElementById('register-view'),
    productsView: document.getElementById('products-view'),
    cartView: document.getElementById('cart-view'),
    adminView: document.getElementById('admin-view'),

    // Formularios
    loginForm: document.getElementById('login-form'),
    registerForm: document.getElementById('register-form'),
    productForm: document.getElementById('product-form'),

    // Navegación
    logoutBtn: document.getElementById('logout-btn'),
    userInfo: document.getElementById('user-info'),
    cartIconBtn: document.getElementById('cart-icon-btn'),
    cartIconContainer: document.getElementById('cart-icon-container'),
    cartCountElement: document.getElementById('cart-count'),
    backToMainBtn: document.getElementById('back-to-main-btn'),

    // Admin
    addProductBtn: document.getElementById('add-product-btn'),
    productFormContainer: document.getElementById('product-form-container'),
    cancelFormBtn: document.getElementById('cancel-form-btn'),
    adminProductsGrid: document.getElementById('admin-products-grid'),

    // Productos
    productsGrid: document.getElementById('products-grid'),
    searchInput: document.getElementById('search-input'),
    clearSearchBtn: document.getElementById('clear-search-btn'),
    noResults: document.getElementById('no-results'),

    // Carrito
    cartItemsList: document.getElementById('cart-items-list'),
    cartEmpty: document.getElementById('cart-empty'),
    clearCartBtn: document.getElementById('clear-cart-btn'),
    cartLoading: document.getElementById('cart-loading'),

    // Modal
    productModal: document.getElementById('product-modal'),
    closeModal: document.querySelector('.close-modal'),
    modalBody: document.getElementById('modal-body'),

    // Notificación
    notification: document.getElementById('notification')
};

/**
 * Mostrar notificación
 */
export function showNotification(message, type = 'info') {
    const notification = elements.notification;
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.style.display = 'block';

    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

/**
 * Mostrar vista específica
 */
export function showView(viewName) {
    elements.loginView.classList.remove('active');
    elements.registerView.classList.remove('active');
    elements.productsView.classList.remove('active');
    elements.cartView.classList.remove('active');
    elements.adminView.classList.remove('active');

    const currentUser = getUser();

    switch(viewName) {
        case 'login':
            elements.loginView.classList.add('active');
            break;
        case 'register':
            elements.registerView.classList.add('active');
            break;
        case 'products':
            elements.productsView.classList.add('active');
            break;
        case 'cart':
            elements.cartView.classList.add('active');
            break;
        case 'admin':
            elements.adminView.classList.add('active');
            break;
    }

    // Mostrar/ocultar botón de regresar según vista
    if (currentUser) {
        if (viewName === 'login' || viewName === 'register') {
            elements.backToMainBtn.style.display = 'none';
        } else if (viewName === 'products' && currentUser.role === 'comprador') {
            elements.backToMainBtn.style.display = 'none';
        } else if (viewName === 'admin' && currentUser.role === 'admin') {
            elements.backToMainBtn.style.display = 'none';
        } else {
            elements.backToMainBtn.style.display = 'block';
        }
    } else {
        elements.backToMainBtn.style.display = 'none';
    }
}

/**
 * Actualizar navbar
 */
export function updateNavbar() {
    const currentUser = getUser();

    if (currentUser) {
        elements.userInfo.textContent = `👤 ${currentUser.username} (${currentUser.role})`;
        elements.logoutBtn.style.display = 'block';

        if (currentUser.role === 'comprador') {
            elements.cartIconContainer.style.display = 'block';
        } else {
            elements.cartIconContainer.style.display = 'none';
        }
    } else {
        elements.userInfo.textContent = '';
        elements.logoutBtn.style.display = 'none';
        elements.cartIconContainer.style.display = 'none';
    }
}

/**
 * Actualizar contador del carrito
 */
export function updateCartCount(count) {
    setCartCount(count);
    elements.cartCountElement.textContent = count;
}

/**
 * Utilidad de debounce para optimización
 */
export function debounce(func, wait) {
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

/**
 * Mostrar/ocultar loading
 */
export function setLoading(isLoading, element = null) {
    const loadingElement = element || document.getElementById('loading-overlay');
    if (loadingElement) {
        loadingElement.style.display = isLoading ? 'block' : 'none';
    }
}

