// filepath: c:\skateboard-shop\public\js\app.js
/**
 * SkateShop - Aplicación principal
 * Archivo de inicialización y orquestación de módulos
 */

import { checkAuth } from './auth.js';
import { setupEventListeners } from './events.js';
import { showView } from './ui.js';
import { loadCartCount } from './cart.js';

/**
 * Inicialización de la aplicación
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('🛹 SkateShop - Iniciando aplicación...');

    // Configurar event listeners
    setupEventListeners();

    // Verificar autenticación
    checkAuth();

    console.log('✅ Aplicación iniciada correctamente');
});

// Exportar funciones globales necesarias para HTML inline events (si las hay)
window.showView = showView;
window.loadCartCount = loadCartCount;
// filepath: c:\skateboard-shop\public\js\config.js
/**
 * Configuración global de la aplicación
 */

// Límites para stock y precio
export const MAX_STOCK = 10000;
export const MAX_PRICE = 99999.99;

// API Base URL - Detección automática del entorno
export const API_URL = (() => {
    // Si estamos en localhost, usar localhost
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:3000/api';
    }
    // Si estamos en producción, usar la URL del backend desplegado
    // ⚠️ IMPORTANTE: CAMBIA ESTA URL por la URL de tu backend desplegado
    return 'https://tu-backend.railway.app/api'; // ⚠️ CAMBIAR ESTA URL
})();

// Función helper para obtener la URL base (sin /api)
export function getBaseUrl() {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:3000';
    }
    return API_URL.replace('/api', '');
}

