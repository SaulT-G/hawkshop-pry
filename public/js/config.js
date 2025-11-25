// ==================== CONFIGURACIÓN Y CONSTANTES ====================

// Límites para stock y precio
const MAX_STOCK = 10000;
const MAX_PRICE = 99999.99;

// API Base URL - Se detecta automáticamente el entorno
const API_URL = (() => {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:3000/api';
    }
    return 'https://tu-backend.railway.app/api'; // ⚠️ CAMBIAR ESTA URL
})();

// Función helper para obtener la URL base (sin /api)
function getBaseUrl() {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:3000';
    }
    return API_URL.replace('/api', '');
}

