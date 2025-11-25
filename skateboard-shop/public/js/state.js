// ==================== ESTADO GLOBAL ====================

// Estado de la aplicación
let currentUser = null;
let currentToken = null;
let editingProductId = null;
let cartItems = [];
let productsCache = null;
let cartCount = 0;

// ==================== ELEMENTOS DEL DOM ====================
// Se inicializan después de que el DOM esté listo

let loginView;
let registerView;
let productsView;
let cartView;
let adminView;
let adminDashboardView;
let loginForm;
let registerForm;
let productForm;
let logoutBtn;
let userInfo;
let addProductBtn;
let productFormContainer;
let cancelFormBtn;
let productModal;
let closeModal;
let cartIconBtn;
let cartIconContainer;
let cartCountElement;
let cartItemsList;
let cartEmpty;
let clearCartBtn;
let backToMainBtn;

// Función para inicializar elementos del DOM
function initDOMElements() {
    loginView = document.getElementById('login-view');
    registerView = document.getElementById('register-view');
    productsView = document.getElementById('products-view');
    cartView = document.getElementById('cart-view');
    adminView = document.getElementById('admin-view');
    adminDashboardView = document.getElementById('admin-dashboard-view');
    loginForm = document.getElementById('login-form');
    registerForm = document.getElementById('register-form');
    productForm = document.getElementById('product-form');
    logoutBtn = document.getElementById('logout-btn');
    userInfo = document.getElementById('user-info');
    addProductBtn = document.getElementById('add-product-btn');
    productFormContainer = document.getElementById('product-form-container');
    cancelFormBtn = document.getElementById('cancel-form-btn');
    productModal = document.getElementById('product-modal');
    closeModal = document.querySelector('.close-modal');
    cartIconBtn = document.getElementById('cart-icon-btn');
    cartIconContainer = document.getElementById('cart-icon-container');
    cartCountElement = document.getElementById('cart-count');
    cartItemsList = document.getElementById('cart-items-list');
    cartEmpty = document.getElementById('cart-empty');
    clearCartBtn = document.getElementById('clear-cart-btn');
    backToMainBtn = document.getElementById('back-to-main-btn');
}

// Llamar a la función initDOMElements cuando el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', initDOMElements);
