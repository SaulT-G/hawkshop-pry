// ==================== EVENT LISTENERS ====================

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

    // Validación de cantidad y precio
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
        backToMainBtn.style.display = 'block';
    });

    cancelFormBtn?.addEventListener('click', () => {
        productFormContainer.style.display = 'none';
        productForm.reset();
        editingProductId = null;
        const imagePreviewContainer = document.getElementById('image-preview-container');
        const productImagenInput = document.getElementById('product-imagen');
        if (imagePreviewContainer && productImagenInput) {
            imagePreviewContainer.style.display = 'none';
            productImagenInput.value = '';
        }
        if (currentUser && currentUser.role === 'admin') {
            backToMainBtn.style.display = 'none';
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

    // Regresar a inicio
    backToMainBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        if (currentUser && currentUser.role === 'admin') {
            showView('admin-dashboard');
        } else {
            showView('products');
            loadProducts();
        }
    });
}

