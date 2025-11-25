// filepath: c:\skateboard-shop\public\js\navigation.js
/**
 * Módulo de navegación
 */

import { getUser } from './state.js';
import { showView, updateNavbar } from './ui.js';
import { loadProducts, loadAdminProducts } from './products.js';

/**
 * Mostrar vista según rol
 */
export function showViewByRole() {
    const currentUser = getUser();

    if (currentUser.role === 'admin') {
        showView('admin');
        loadAdminProducts();
    } else {
        showView('products');
        loadProducts();
    }
    updateNavbar();
}

