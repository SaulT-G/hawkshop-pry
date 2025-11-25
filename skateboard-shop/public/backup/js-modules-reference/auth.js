// filepath: c:\skateboard-shop\public\js\auth.js
/**
 * Módulo de autenticación
 */

import * as api from './api.js';
import { setUser, setToken, getToken, clearAuth } from './state.js';
import { showNotification, showView, updateNavbar } from './ui.js';
import { showViewByRole } from './navigation.js';
import { clearProductsCache } from './state.js';

/**
 * Verificar autenticación
 */
export async function checkAuth() {
    const token = getToken();

    if (token) {
        try {
            const response = await api.verifyAuth();

            if (response.ok) {
                const data = await response.json();
                setUser(data.user);
                setToken(token);
                showViewByRole();
            } else {
                clearAuth();
                showView('login');
            }
        } catch (error) {
            console.error('Error verificando autenticación:', error);
            clearAuth();
            showView('login');
        }
    } else {
        showView('login');
    }
}

/**
 * Manejar login
 */
export async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    try {
        const response = await api.login(username, password);
        const data = await response.json();

        if (response.ok) {
            setToken(data.token);
            setUser(data.user);
            clearProductsCache();
            showNotification('Login exitoso', 'success');
            showViewByRole();
        } else {
            showNotification(data.error || 'Error al iniciar sesión', 'error');
        }
    } catch (error) {
        showNotification('Error de conexión', 'error');
        console.error('Error:', error);
    }
}

/**
 * Manejar registro
 */
export async function handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById('register-username').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;

    try {
        const response = await api.register(username, email, password);
        const data = await response.json();

        if (response.ok) {
            setToken(data.token);
            setUser(data.user);
            clearProductsCache();
            showNotification('Cuenta creada exitosamente', 'success');
            showViewByRole();
        } else {
            showNotification(data.error || 'Error al crear cuenta', 'error');
        }
    } catch (error) {
        showNotification('Error de conexión', 'error');
        console.error('Error:', error);
    }
}

/**
 * Manejar logout
 */
export async function handleLogout() {
    clearAuth();
    showView('login');
    updateNavbar();
    showNotification('Sesión cerrada', 'info');
}

