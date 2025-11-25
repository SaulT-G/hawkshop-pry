// filepath: c:\skateboard-shop\public\js\cart.js
/**
 * Módulo de gestión del carrito
 */

import * as api from './api.js';
import { getBaseUrl } from './config.js';
import { getUser, setCartItems, getCartItems } from './state.js';
import { showNotification, elements, updateCartCount } from './ui.js';
import { clearProductsCache } from './state.js';

/**
 * Cargar carrito
 */
export async function loadCart() {
    const currentUser = getUser();
    if (!currentUser || currentUser.role !== 'comprador') return;

    elements.cartLoading.style.display = 'block';
    elements.cartItemsList.innerHTML = '';
    elements.cartEmpty.style.display = 'none';

    try {
        const response = await api.fetchCart();

        if (response.ok) {
            const cartItems = await response.json();
            setCartItems(cartItems);
            elements.cartLoading.style.display = 'none';

            if (cartItems.length === 0) {
                elements.cartEmpty.style.display = 'block';
                elements.clearCartBtn.style.display = 'none';
            } else {
                displayCartItems();
                elements.clearCartBtn.style.display = 'block';
            }
            updateCartCountFromItems();
        } else {
            showNotification('Error al cargar carrito', 'error');
            elements.cartLoading.style.display = 'none';
        }
    } catch (error) {
        showNotification('Error de conexión', 'error');
        elements.cartLoading.style.display = 'none';
        console.error('Error:', error);
    }
}

/**
 * Mostrar items del carrito
 */
function displayCartItems() {
    const cartItems = getCartItems();
    const fragment = document.createDocumentFragment();

    cartItems.forEach(item => {
        const cartItem = createCartItemElement(item);
        fragment.appendChild(cartItem);
    });

    elements.cartItemsList.innerHTML = '';
    elements.cartItemsList.appendChild(fragment);
}

/**
 * Crear elemento de item del carrito
 */
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
                <button class="quantity-btn quantity-decrease" data-cart-id="${item.id}" data-quantity="${item.quantity - 1}">-</button>
                <input type="number" class="quantity-input" value="${item.quantity}" min="1" max="${item.stock}" 
                       data-cart-id="${item.id}">
                <button class="quantity-btn quantity-increase" data-cart-id="${item.id}" data-quantity="${item.quantity + 1}">+</button>
            </div>
            <div class="cart-item-total">
                <span class="cart-item-total-label">Total:</span>
                <span class="cart-item-total-price">$${precioTotal.toFixed(2)}</span>
            </div>
            <button class="cart-item-remove" data-cart-id="${item.id}">Eliminar</button>
        </div>
    `;

    // Event listeners
    const decreaseBtn = div.querySelector('.quantity-decrease');
    const increaseBtn = div.querySelector('.quantity-increase');
    const quantityInput = div.querySelector('.quantity-input');
    const removeBtn = div.querySelector('.cart-item-remove');

    decreaseBtn.addEventListener('click', () => {
        updateCartQuantity(item.id, item.quantity - 1, item.stock);
    });

    increaseBtn.addEventListener('click', () => {
        updateCartQuantity(item.id, item.quantity + 1, item.stock);
    });

    quantityInput.addEventListener('change', (e) => {
        const newQuantity = parseInt(e.target.value);
        updateCartQuantity(item.id, newQuantity, item.stock);
    });

    removeBtn.addEventListener('click', () => {
        removeFromCart(item.id);
    });

    return div;
}

/**
 * Agregar al carrito
 */
export async function addToCart(productId) {
    const currentUser = getUser();
    if (!currentUser || currentUser.role !== 'comprador') {
        showNotification('Debes iniciar sesión como comprador', 'error');
        return;
    }

    try {
        const response = await api.addToCartAPI(productId, 1);
        const data = await response.json();

        if (response.ok) {
            showNotification('Producto agregado al carrito', 'success');
            loadCartCount();
            clearProductsCache();
        } else {
            showNotification(data.error || 'Error al agregar al carrito', 'error');
        }
    } catch (error) {
        showNotification('Error de conexión', 'error');
        console.error('Error:', error);
    }
}

/**
 * Actualizar cantidad en carrito
 */
async function updateCartQuantity(cartId, quantity, maxStock) {
    if (quantity < 1) {
        removeFromCart(cartId);
        return;
    }

    if (quantity > maxStock) {
        showNotification('Stock insuficiente', 'error');
        return;
    }

    try {
        const response = await api.updateCartItem(cartId, quantity);

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
}

/**
 * Eliminar del carrito
 */
async function removeFromCart(cartId) {
    try {
        const response = await api.removeCartItem(cartId);

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
}

/**
 * Vaciar carrito
 */
export async function handleClearCart() {
    if (!confirm('¿Estás seguro de vaciar el carrito?')) {
        return;
    }

    try {
        const response = await api.clearCart();

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

/**
 * Cargar contador del carrito
 */
export async function loadCartCount() {
    const currentUser = getUser();
    if (!currentUser || currentUser.role !== 'comprador') return;

    try {
        const response = await api.fetchCart();

        if (response.ok) {
            const items = await response.json();
            const count = items.reduce((sum, item) => sum + item.quantity, 0);
            updateCartCount(count);
        }
    } catch (error) {
        console.error('Error al cargar contador del carrito:', error);
    }
}

/**
 * Actualizar contador desde items actuales
 */
function updateCartCountFromItems() {
    const cartItems = getCartItems();
    const count = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    updateCartCount(count);
}

