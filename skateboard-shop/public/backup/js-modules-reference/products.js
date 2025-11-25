// filepath: c:\skateboard-shop\public\js\products.js
/**
 * Módulo de gestión de productos
 */

import * as api from './api.js';
import { getBaseUrl, MAX_STOCK, MAX_PRICE } from './config.js';
import {
    getUser,
    getProductsCache,
    setProductsCache,
    clearProductsCache,
    getEditingProductId,
    setEditingProductId
} from './state.js';
import { showNotification, elements } from './ui.js';
import { addToCart } from './cart.js';

/**
 * Cargar productos (comprador)
 */
export async function loadProducts() {
    const productsCache = getProductsCache();

    if (productsCache) {
        displayProducts(productsCache, elements.productsGrid);
        elements.noResults.style.display = 'none';
        return;
    }

    try {
        const response = await api.fetchProducts();

        if (response.ok) {
            const products = await response.json();
            setProductsCache(products);
            displayProducts(products, elements.productsGrid);
            elements.noResults.style.display = 'none';
        } else {
            showNotification('Error al cargar productos', 'error');
        }
    } catch (error) {
        showNotification('Error de conexión', 'error');
        console.error('Error:', error);
    }
}

/**
 * Buscar productos
 */
export async function searchProducts(searchTerm) {
    try {
        const response = await api.fetchProducts(searchTerm);

        if (response.ok) {
            const products = await response.json();

            if (products.length === 0) {
                elements.noResults.style.display = 'block';
            } else {
                elements.noResults.style.display = 'none';
            }
            displayProducts(products, elements.productsGrid);
        } else {
            showNotification('Error al buscar productos', 'error');
        }
    } catch (error) {
        showNotification('Error de conexión', 'error');
        console.error('Error:', error);
    }
}

/**
 * Cargar productos (admin)
 */
export async function loadAdminProducts() {
    try {
        const response = await api.fetchProducts();

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

/**
 * Mostrar productos
 */
function displayProducts(products, container) {
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

/**
 * Crear tarjeta de producto
 */
function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';

    const imageUrl = product.imagen
        ? `${getBaseUrl()}/uploads/${product.imagen}`
        : null;

    const currentUser = getUser();
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
                ? `<button class="btn-add-cart" data-product-id="${product.id}">Agregar al Carrito</button>`
                : ''}
        </div>
    `;

    // Event listeners
    card.addEventListener('click', (e) => {
        if (!e.target.classList.contains('btn-add-cart')) {
            showProductModal(product);
        }
    });

    const addCartBtn = card.querySelector('.btn-add-cart');
    if (addCartBtn) {
        addCartBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            addToCart(product.id);
        });
    }

    return card;
}

/**
 * Mostrar productos admin
 */
function displayAdminProducts(products) {
    const container = elements.adminProductsGrid;
    container.innerHTML = '';

    if (products.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: white; font-size: 1.2rem;">No hay productos. Agrega uno nuevo.</p>';
        return;
    }

    const fragment = document.createDocumentFragment();
    products.forEach(product => {
        const productCard = createAdminProductCard(product);
        fragment.appendChild(productCard);
    });

    container.appendChild(fragment);
}

/**
 * Crear tarjeta de producto admin
 */
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
                <button class="btn-edit" data-product-id="${product.id}">Editar</button>
                <button class="btn-delete" data-product-id="${product.id}">Eliminar</button>
            </div>
        </div>
    `;

    // Event listeners
    const editBtn = card.querySelector('.btn-edit');
    const deleteBtn = card.querySelector('.btn-delete');

    editBtn.addEventListener('click', () => editProduct(product.id));
    deleteBtn.addEventListener('click', () => deleteProduct(product.id));

    return card;
}

/**
 * Editar producto
 */
export async function editProduct(productId) {
    try {
        const response = await api.fetchProducts();

        if (response.ok) {
            const products = await response.json();
            const product = products.find(p => p.id === productId);

            if (product) {
                setEditingProductId(productId);
                document.getElementById('product-id').value = productId;
                document.getElementById('product-titulo').value = product.titulo;
                document.getElementById('product-detalle').value = product.detalle;
                document.getElementById('product-cantidad').value = Math.min(product.cantidad, MAX_STOCK);
                document.getElementById('product-precio').value = Math.min(product.precio || 0, MAX_PRICE);
                document.getElementById('form-title').textContent = 'Editar Producto';

                // Limpiar preview de imagen
                const imagePreviewContainer = document.getElementById('image-preview-container');
                const productImagenInput = document.getElementById('product-imagen');
                if (imagePreviewContainer && productImagenInput) {
                    imagePreviewContainer.style.display = 'none';
                    productImagenInput.value = '';
                }

                elements.productFormContainer.style.display = 'block';
                elements.productFormContainer.scrollIntoView({ behavior: 'smooth' });
            }
        }
    } catch (error) {
        showNotification('Error al cargar producto', 'error');
        console.error('Error:', error);
    }
}

/**
 * Eliminar producto
 */
export async function deleteProduct(productId) {
    if (!confirm('¿Estás seguro de eliminar este producto?')) {
        return;
    }

    try {
        const response = await api.deleteProduct(productId);

        if (response.ok) {
            showNotification('Producto eliminado exitosamente', 'success');
            clearProductsCache();
            loadAdminProducts();
        } else {
            const data = await response.json();
            showNotification(data.error || 'Error al eliminar producto', 'error');
        }
    } catch (error) {
        showNotification('Error de conexión', 'error');
        console.error('Error:', error);
    }
}

/**
 * Manejar envío de formulario de producto
 */
export async function handleProductSubmit(e) {
    e.preventDefault();

    const titulo = document.getElementById('product-titulo').value;
    const detalle = document.getElementById('product-detalle').value;
    const cantidadRaw = document.getElementById('product-cantidad').value;
    const precioRaw = document.getElementById('product-precio').value;

    const cantidad = parseInt(cantidadRaw, 10);
    const precio = parseFloat(precioRaw);

    // Validación
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

    const editingProductId = getEditingProductId();

    try {
        const response = editingProductId
            ? await api.updateProduct(editingProductId, formData)
            : await api.createProduct(formData);

        const data = await response.json();

        if (response.ok) {
            showNotification(
                editingProductId ? 'Producto actualizado exitosamente' : 'Producto creado exitosamente',
                'success'
            );
            elements.productForm.reset();

            // Limpiar preview de imagen
            const imagePreviewContainer = document.getElementById('image-preview-container');
            if (imagePreviewContainer) {
                imagePreviewContainer.style.display = 'none';
            }

            elements.productFormContainer.style.display = 'none';
            setEditingProductId(null);
            clearProductsCache();
            loadAdminProducts();

            const currentUser = getUser();
            if (currentUser && currentUser.role === 'admin') {
                elements.backToMainBtn.style.display = 'none';
            }
        } else {
            showNotification(data.error || 'Error al guardar producto', 'error');
        }
    } catch (error) {
        showNotification('Error de conexión', 'error');
        console.error('Error:', error);
    }
}

/**
 * Mostrar modal de producto
 */
export function showProductModal(product) {
    const imageUrl = product.imagen
        ? `${getBaseUrl()}/uploads/${product.imagen}`
        : null;

    const currentUser = getUser();
    const isComprador = currentUser && currentUser.role === 'comprador';

    elements.modalBody.innerHTML = `
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
            ? `<button class="btn-primary modal-add-cart" data-product-id="${product.id}" style="margin-top: 1rem; width: auto;">Agregar al Carrito</button>`
            : ''}
    `;

    const addCartBtn = elements.modalBody.querySelector('.modal-add-cart');
    if (addCartBtn) {
        addCartBtn.addEventListener('click', () => {
            addToCart(product.id);
            elements.productModal.style.display = 'none';
        });
    }

    elements.productModal.style.display = 'block';
}

