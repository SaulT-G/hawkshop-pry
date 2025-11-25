// ==================== GESTIÓN DEL CARRITO ====================

// Cargar carrito
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

// Mostrar items del carrito
function displayCartItems() {
    const fragment = document.createDocumentFragment();

    cartItems.forEach(item => {
        const cartItem = createCartItemElement(item);
        fragment.appendChild(cartItem);
    });

    cartItemsList.innerHTML = '';
    cartItemsList.appendChild(fragment);
}

// Crear elemento de item del carrito
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

// Agregar al carrito
function addToCart(productId) {
    if (!currentUser || currentUser.role !== 'comprador') {
        showNotification('Debes iniciar sesión como comprador', 'error');
        return;
    }

    fetch(`${API_URL}/cart`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${currentToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ product_id: productId, quantity: 1 })
    })
    .then(response => response.json())
    .then(data => {
        showNotification('Producto agregado al carrito', 'success');
        loadCartCount();
        productsCache = null;
    })
    .catch(error => {
        showNotification('Error de conexión', 'error');
        console.error('Error:', error);
    });
}

// Actualizar cantidad en carrito
function updateCartQuantity(cartId, quantity) {
    if (quantity < 1) {
        removeFromCart(cartId);
        return;
    }

    const item = cartItems.find(i => i.id === cartId);
    if (item && quantity > item.stock) {
        showNotification('Stock insuficiente', 'error');
        return;
    }

    fetch(`${API_URL}/cart/${cartId}`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${currentToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ quantity })
    })
    .then(response => {
        if (response.ok) {
            loadCart();
        } else {
            return response.json().then(data => {
                showNotification(data.error || 'Error al actualizar cantidad', 'error');
            });
        }
    })
    .catch(error => {
        showNotification('Error de conexión', 'error');
        console.error('Error:', error);
    });
}

// Eliminar del carrito
async function removeFromCart(cartId) {
    try {
        const response = await fetch(`${API_URL}/cart/${cartId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${currentToken}`
            }
        });

        const data = await response.json();

        if (response.ok && data.success) {
            showNotification('Producto eliminado del carrito', 'success');
            await loadCart();
            await loadCartCount();
        } else {
            showNotification(data.error || 'Error al eliminar del carrito', 'error');
        }
    } catch (error) {
        showNotification('Error de conexión', 'error');
        console.error('Error:', error);
    }
}

// Vaciar carrito
async function handleClearCart() {
    const confirmed = await showConfirm({
        icon: '🛒',
        title: 'Vaciar Carrito',
        message: '¿Estás seguro de que deseas vaciar todo el carrito? Esta acción no se puede deshacer.',
        confirmText: 'Sí, vaciar',
        cancelText: 'Cancelar'
    });

    if (!confirmed) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/cart`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${currentToken}`
            }
        });

        const data = await response.json();

        if (response.ok && data.success) {
            showNotification('Carrito vaciado', 'success');
            await loadCart();
            await loadCartCount();
        } else {
            showNotification(data.error || 'Error al vaciar carrito', 'error');
        }
    } catch (error) {
        showNotification('Error de conexión', 'error');
        console.error('Error:', error);
    }
}

// Cargar contador del carrito
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

// Actualizar contador
function updateCartCount() {
    const count = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    cartCount = count;
    cartCountElement.textContent = count;
}
