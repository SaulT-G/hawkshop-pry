// filepath: c:\skateboard-shop\public\js\api.js
/**
 * Módulo para llamadas a la API
 */

import { API_URL } from './config.js';
import { getToken } from './state.js';

/**
 * Realiza una petición HTTP a la API
 */
async function request(endpoint, options = {}) {
    const token = getToken();
    const headers = {
        ...options.headers
    };

    if (token && !headers.Authorization) {
        headers.Authorization = `Bearer ${token}`;
    }

    const config = {
        ...options,
        headers
    };

    const response = await fetch(`${API_URL}${endpoint}`, config);
    return response;
}

// Autenticación
export async function login(username, password) {
    const response = await request('/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
    });
    return response;
}

export async function register(username, email, password) {
    const response = await request('/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, email, password })
    });
    return response;
}

export async function verifyAuth() {
    const response = await request('/verify');
    return response;
}

// Productos
export async function fetchProducts(searchTerm = '') {
    const endpoint = searchTerm
        ? `/products?search=${encodeURIComponent(searchTerm)}`
        : '/products';
    const response = await request(endpoint);
    return response;
}

export async function createProduct(formData) {
    const response = await request('/products', {
        method: 'POST',
        body: formData
    });
    return response;
}

export async function updateProduct(productId, formData) {
    const response = await request(`/products/${productId}`, {
        method: 'PUT',
        body: formData
    });
    return response;
}

export async function deleteProduct(productId) {
    const response = await request(`/products/${productId}`, {
        method: 'DELETE'
    });
    return response;
}

// Carrito
export async function fetchCart() {
    const response = await request('/cart');
    return response;
}

export async function addToCartAPI(productId, quantity) {
    const response = await request('/cart', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ product_id: productId, quantity })
    });
    return response;
}

export async function updateCartItem(cartId, quantity) {
    const response = await request(`/cart/${cartId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ quantity })
    });
    return response;
}

export async function removeCartItem(cartId) {
    const response = await request(`/cart/${cartId}`, {
        method: 'DELETE'
    });
    return response;
}

export async function clearCart() {
    const response = await request('/cart', {
        method: 'DELETE'
    });
    return response;
}

