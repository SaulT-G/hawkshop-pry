// ==================== UTILIDADES ====================

// Utilidad de debounce para optimización
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Mostrar notificación mejorada
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');

    // Limpiar clases previas
    notification.classList.remove('hiding');

    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.style.display = 'block';

    // Auto-ocultar después de 3 segundos con animación
    setTimeout(() => {
        notification.classList.add('hiding');

        // Remover el elemento después de la animación
        setTimeout(() => {
            notification.style.display = 'none';
            notification.classList.remove('hiding');
        }, 300);
    }, 3000);
}

// Modal de confirmación personalizado
function showConfirm(options = {}) {
    return new Promise((resolve) => {
        const modal = document.getElementById('confirm-modal');
        const icon = document.getElementById('confirm-icon');
        const title = document.getElementById('confirm-title');
        const message = document.getElementById('confirm-message');
        const btnYes = document.getElementById('confirm-btn-yes');
        const btnNo = document.getElementById('confirm-btn-no');

        // Configurar el contenido
        icon.textContent = options.icon || '⚠️';
        title.textContent = options.title || '¿Estás seguro?';
        message.textContent = options.message || 'Esta acción no se puede deshacer.';
        btnYes.textContent = options.confirmText || 'Sí, eliminar';
        btnNo.textContent = options.cancelText || 'Cancelar';

        // Mostrar modal
        modal.classList.add('active');

        // Función para cerrar
        const close = (result) => {
            modal.classList.remove('active');
            resolve(result);
            // Limpiar event listeners
            btnYes.onclick = null;
            btnNo.onclick = null;
        };

        // Event listeners
        btnYes.onclick = () => close(true);
        btnNo.onclick = () => close(false);

        // Cerrar al hacer clic fuera
        modal.onclick = (e) => {
            if (e.target === modal) {
                close(false);
            }
        };
    });
}
