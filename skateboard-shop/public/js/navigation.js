// ==================== NAVEGACIÓN ====================

// Mostrar vista según rol
function showViewByRole() {
    if (currentUser.role === 'admin') {
        showView('admin-dashboard');
    } else {
        showView('products');
        loadProducts();
    }
    updateNavbar();
}

// Mostrar vista específica - OPTIMIZADO
function showView(viewName) {
    requestAnimationFrame(() => {
        loginView.classList.remove('active');
        registerView.classList.remove('active');
        productsView.classList.remove('active');
        cartView.classList.remove('active');
        adminView.classList.remove('active');
        adminDashboardView.classList.remove('active');

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
            case 'admin-dashboard':
                adminDashboardView.classList.add('active');
                setupAdminDashboard();
                break;
        }

        // Gestión del botón "Volver al Inicio"
        if (currentUser) {
            if (viewName === 'login' || viewName === 'register') {
                backToMainBtn.style.display = 'none';
            } else if (viewName === 'products' && currentUser.role === 'comprador') {
                backToMainBtn.style.display = 'none';
            } else if (viewName === 'admin-dashboard' && currentUser.role === 'admin') {
                backToMainBtn.style.display = 'none';
            } else {
                backToMainBtn.style.display = 'block';
            }
        } else {
            backToMainBtn.style.display = 'none';
        }
    });
}

// Configurar dashboard del admin
function setupAdminDashboard() {
    const manageProductsCard = document.getElementById('manage-products-card');

    const newManageProductsCard = manageProductsCard?.cloneNode(true);
    if (manageProductsCard && newManageProductsCard) {
        manageProductsCard.parentNode.replaceChild(newManageProductsCard, manageProductsCard);
    }

    const cardButton = newManageProductsCard?.querySelector('.card-button');
    cardButton?.addEventListener('click', (e) => {
        e.stopPropagation();
        showView('admin');
        loadAdminProducts();
    });

    newManageProductsCard?.addEventListener('click', () => {
        if (!newManageProductsCard.classList.contains('disabled')) {
            showView('admin');
            loadAdminProducts();
        }
    });
}

