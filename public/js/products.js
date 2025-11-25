// ==================== GESTIÓN DE PRODUCTOS ====================

// Cargar productos (comprador) - Optimizado con caché
async function loadProducts() {
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
            productsCache = products;
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

    const fragment = document.createDocumentFragment();
    products.forEach(product => {
        const productCard = createProductCard(product);
        fragment.appendChild(productCard);
    });

    container.innerHTML = '';
    container.appendChild(fragment);
}

// Crear tarjeta de producto
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
function editProduct(productId) {
    fetch(`${API_URL}/products`, {
        headers: {
            'Authorization': `Bearer ${currentToken}`
        }
    })
    .then(response => response.json())
    .then(products => {
        const product = products.find(p => p.id === productId);

        if (product) {
            editingProductId = productId;
            document.getElementById('product-id').value = productId;
            document.getElementById('product-titulo').value = product.titulo;
            document.getElementById('product-detalle').value = product.detalle;
            document.getElementById('product-cantidad').value = Math.min(product.cantidad, MAX_STOCK);
            document.getElementById('product-precio').value = Math.min(product.precio || 0, MAX_PRICE);
            document.getElementById('form-title').textContent = 'Editar Producto';

            const imagePreviewContainer = document.getElementById('image-preview-container');
            const productImagenInput = document.getElementById('product-imagen');
            if (imagePreviewContainer && productImagenInput) {
                imagePreviewContainer.style.display = 'none';
                productImagenInput.value = '';
            }

            productFormContainer.style.display = 'block';
            productFormContainer.scrollIntoView({ behavior: 'smooth' });
        }
    })
    .catch(error => {
        showNotification('Error al cargar producto', 'error');
        console.error('Error:', error);
    });
}

// Eliminar producto
async function deleteProduct(productId) {
    const confirmed = await showConfirm({
        icon: '🗑️',
        title: 'Eliminar Producto',
        message: '¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer.',
        confirmText: 'Sí, eliminar',
        cancelText: 'Cancelar'
    });

    if (!confirmed) {
        return;
    }

    fetch(`${API_URL}/products/${productId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${currentToken}`
        }
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showNotification('Producto eliminado correctamente', 'success');
                loadAdminProducts();
            } else {
                showNotification(data.error || 'Error al eliminar producto', 'error');
            }
        })
        .catch(() => {
            showNotification('Error de conexión', 'error');
        });
}

// Manejar envío de formulario de producto
async function handleProductSubmit(e) {
    e.preventDefault();

    const titulo = document.getElementById('product-titulo').value;
    const detalle = document.getElementById('product-detalle').value;
    const cantidadRaw = document.getElementById('product-cantidad').value;
    const precioRaw = document.getElementById('product-precio').value;

    const cantidad = parseInt(cantidadRaw, 10);
    const precio = parseFloat(precioRaw);

    if (isNaN(cantidad) || cantidad < 0 || cantidad > MAX_STOCK) {
        showNotification(`Cantidad inválida. Debe estar entre 0 y ${MAX_STOCK}`, 'error');
        return;
    }

    if (isNaN(precio) || precio < 0 || precio > MAX_PRICE) {
        showNotification(`Precio inválido. Debe estar entre 0 y ${MAX_PRICE.toFixed(2)}`, 'error');
        return;
    }

    const formData = new FormData();
    formData.append('titulo', titulo);
    formData.append('detalle', detalle);
    formData.append('cantidad', cantidad);
    formData.append('precio', precio.toFixed(2));

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
            const imagePreviewContainer = document.getElementById('image-preview-container');
            if (imagePreviewContainer) {
                imagePreviewContainer.style.display = 'none';
            }
            productFormContainer.style.display = 'none';
            editingProductId = null;
            productsCache = null;
            loadAdminProducts();
            if (currentUser && currentUser.role === 'admin') {
                backToMainBtn.style.display = 'none';
            }
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
