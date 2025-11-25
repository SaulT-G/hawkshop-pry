// ==================== INICIALIZACIÓN ====================

// Inicialización al cargar el DOM
document.addEventListener('DOMContentLoaded', () => {
    initDOMElements(); // Primero inicializar elementos del DOM
    checkAuth();
    setupEventListeners();
});

// Hacer showView global para uso en HTML
window.showView = showView;
