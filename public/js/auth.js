// ==================== AUTENTICACIÓN ====================

// Verificar autenticación
async function checkAuth() {
    const token = localStorage.getItem('token');
    if (token) {
        try {
            const response = await fetch(`${API_URL}/verify`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                currentUser = data.user;
                currentToken = token;
                showViewByRole();
            } else {
                localStorage.removeItem('token');
                showView('login');
            }
        } catch (error) {
            console.error('Error verificando autenticación:', error);
            localStorage.removeItem('token');
            showView('login');
        }
    } else {
        showView('login');
    }
}

// Manejar login
async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            currentToken = data.token;
            currentUser = data.user;
            localStorage.setItem('token', data.token);
            productsCache = null;
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

// Manejar registro
async function handleRegister(e) {
    e.preventDefault();

    // Obtener valores del formulario
    const fullname = document.getElementById('register-fullname').value.trim();
    const username = document.getElementById('register-username').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value;
    const passwordConfirm = document.getElementById('register-password-confirm').value;

    // Validación 1: Campos vacíos
    if (!fullname || !username || !email || !password || !passwordConfirm) {
        showNotification('Todos los campos son requeridos', 'error');
        return;
    }

    // Validación 2: Nombre completo mínimo
    if (fullname.length < 3) {
        showNotification('El nombre completo debe tener al menos 3 caracteres', 'error');
        return;
    }

    // Validación 3: Nombre de usuario mínimo
    if (username.length < 3) {
        showNotification('El nombre de usuario debe tener al menos 3 caracteres', 'error');
        return;
    }

    // Validación 4: Formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showNotification('Por favor, ingresa un correo electrónico válido', 'error');
        return;
    }

    // Validación 5: Contraseñas coinciden
    if (password !== passwordConfirm) {
        showNotification('Las contraseñas no coinciden', 'error');
        return;
    }

    // Validación 6: Longitud mínima de contraseña
    if (password.length < 8) {
        showNotification('La contraseña debe tener al menos 8 caracteres', 'error');
        return;
    }

    // Validación 7: Requisitos de seguridad de contraseña
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);

    if (!hasUpperCase) {
        showNotification('La contraseña debe contener al menos una letra mayúscula', 'error');
        return;
    }

    if (!hasLowerCase) {
        showNotification('La contraseña debe contener al menos una letra minúscula', 'error');
        return;
    }

    if (!hasNumber) {
        showNotification('La contraseña debe contener al menos un número', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                fullname,
                username,
                email,
                password
            })
        });

        const data = await response.json();

        if (response.ok) {
            showNotification('¡Cuenta creada exitosamente! Bienvenido a SkateShop', 'success');

            // Limpiar formulario
            document.getElementById('register-form').reset();

            // Esperar un momento antes de redirigir al login
            setTimeout(() => {
                showView('login');
                showNotification('Ahora puedes iniciar sesión con tu cuenta', 'info');
            }, 1500);
        } else {
            // Mensajes de error específicos según el problema
            if (data.error.includes('email')) {
                showNotification('Este correo electrónico ya está registrado. Por favor, elige otro', 'error');
            } else if (data.error.includes('username') || data.error.includes('usuario')) {
                showNotification('Este nombre de usuario ya está en uso. Por favor, elige otro', 'error');
            } else {
                showNotification(data.error || 'Error al crear cuenta', 'error');
            }
        }
    } catch (error) {
        showNotification('Error de conexión con el servidor', 'error');
        console.error('Error:', error);
    }
}

// Manejar logout
function handleLogout() {
    currentUser = null;
    currentToken = null;
    cartItems = [];
    cartCount = 0;
    productsCache = null;
    localStorage.removeItem('token');
    showView('login');
    updateNavbar();
    showNotification('Sesión cerrada', 'info');
}

// Actualizar navbar
function updateNavbar() {
    if (currentUser) {
        userInfo.textContent = `👤 ${currentUser.username} (${currentUser.role})`;
        logoutBtn.style.display = 'block';

        if (currentUser.role === 'comprador') {
            cartIconContainer.style.display = 'block';
            loadCartCount();
        } else {
            cartIconContainer.style.display = 'none';
        }
    } else {
        userInfo.textContent = '';
        logoutBtn.style.display = 'none';
        cartIconContainer.style.display = 'none';
    }
}
