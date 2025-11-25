// filepath: c:\skateboard-shop\public\js\state.js
/**
 * Estado global de la aplicación
 */

export const state = {
    currentUser: null,
    currentToken: null,
    editingProductId: null,
    cartItems: [],
    productsCache: null,
    cartCount: 0
};

// Getters y setters para el estado
export function setUser(user) {
    state.currentUser = user;
}

export function getUser() {
    return state.currentUser;
}

export function setToken(token) {
    state.currentToken = token;
    if (token) {
        localStorage.setItem('token', token);
    } else {
        localStorage.removeItem('token');
    }
}

export function getToken() {
    return state.currentToken || localStorage.getItem('token');
}

export function clearAuth() {
    state.currentUser = null;
    state.currentToken = null;
    state.cartItems = [];
    state.cartCount = 0;
    state.productsCache = null;
    localStorage.removeItem('token');
}

export function setProductsCache(products) {
    state.productsCache = products;
}

export function getProductsCache() {
    return state.productsCache;
}

export function clearProductsCache() {
    state.productsCache = null;
}

export function setCartItems(items) {
    state.cartItems = items;
}

export function getCartItems() {
    return state.cartItems;
}

export function setCartCount(count) {
    state.cartCount = count;
}

export function getCartCount() {
    return state.cartCount;
}

export function setEditingProductId(id) {
    state.editingProductId = id;
}

export function getEditingProductId() {
    return state.editingProductId;
}

