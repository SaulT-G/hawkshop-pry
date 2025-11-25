# 🎨 Guía de Estilos HTML - SkateShop

## Organización del HTML

El archivo `index.html` ha sido reformateado siguiendo estas convenciones:

### 1. Comentarios de Sección
Cada sección principal está delimitada con comentarios visuales:

```html
<!-- ==================== SECCIÓN ==================== -->
```

### 2. Estructura Jerárquica Clara
- Indentación consistente de 4 espacios
- Elementos anidados correctamente
- Cierre de tags en la misma columna de apertura

### 3. Atributos en Líneas Separadas (cuando hay muchos)
```html
<!-- Bien: Pocos atributos -->
<input type="text" id="search-input" class="search-input">

<!-- Bien: Muchos atributos, mejor legibilidad -->
<input 
    type="number" 
    id="product-cantidad" 
    min="0" 
    max="10000" 
    required 
    title="Máximo 10000">
```

### 4. Comentarios Descriptivos
- Identifican subsecciones
- Explican propósitos especiales
- Facilitan la navegación

### 5. Orden de Secciones
1. Navbar
2. Contenedor Principal
3. Vistas (Login, Registro, Productos, Carrito, Admin)
4. Modales
5. Notificaciones
6. Scripts

## Buenas Prácticas Aplicadas

✅ Semántica HTML5
✅ Accesibilidad (aria-labels)
✅ Indicadores visuales (asteriscos para campos requeridos)
✅ Comentarios que explican, no repiten
✅ Separación de concerns (HTML/CSS/JS)

---

Esta estructura facilita encontrar rápidamente cualquier elemento del DOM.
# 🛹 SkateShop - Documentación de Refactorización

## 📁 Nueva Estructura del Proyecto

La aplicación ha sido refactorizada para mejorar la mantenibilidad y escalabilidad del código.

### Estructura de Carpetas

```
public/
├── js/                      # Módulos JavaScript (ES6)
│   ├── app.js              # Archivo principal de inicialización
│   ├── config.js           # Configuración y constantes
│   ├── state.js            # Gestión del estado global
│   ├── api.js              # Llamadas a la API
│   ├── auth.js             # Autenticación y sesiones
│   ├── navigation.js       # Navegación entre vistas
│   ├── products.js         # Gestión de productos
│   ├── cart.js             # Gestión del carrito
│   ├── ui.js               # Utilidades de UI
│   └── events.js           # Event listeners
├── backup/                  # Archivos antiguos (respaldo)
│   └── app.js.old          # Versión monolítica original
├── index.html              # HTML reformateado y comentado
└── styles.css              # Estilos CSS

```

## 🎯 Módulos y Responsabilidades

### 1. **config.js** - Configuración Global
- Constantes de la aplicación (MAX_STOCK, MAX_PRICE)
- URL de la API según el entorno
- Funciones de configuración reutilizables

### 2. **state.js** - Gestión del Estado
- Estado global de la aplicación
- Getters y setters para acceso controlado
- Gestión de localStorage para persistencia

### 3. **api.js** - Capa de Comunicación
- Todas las llamadas HTTP a la API
- Funciones para autenticación, productos y carrito
- Manejo centralizado de headers y tokens

### 4. **auth.js** - Autenticación
- Login y registro de usuarios
- Verificación de tokens
- Gestión de sesiones
- Logout

### 5. **navigation.js** - Navegación
- Control de vistas según rol de usuario
- Lógica de navegación entre páginas

### 6. **products.js** - Gestión de Productos
- Cargar y mostrar productos
- Búsqueda de productos
- CRUD de productos (admin)
- Creación dinámica de cards
- Modal de detalles

### 7. **cart.js** - Gestión del Carrito
- Agregar productos al carrito
- Actualizar cantidades
- Eliminar items
- Vaciar carrito
- Contador de items

### 8. **ui.js** - Utilidades de Interfaz
- Referencias a elementos del DOM
- Mostrar/ocultar vistas
- Notificaciones
- Actualización de navbar
- Funciones de utilidad (debounce, etc.)

### 9. **events.js** - Event Listeners
- Configuración centralizada de todos los eventos
- Listeners de formularios
- Listeners de navegación
- Validaciones de inputs

### 10. **app.js** - Punto de Entrada
- Inicialización de la aplicación
- Orquestación de módulos
- DOMContentLoaded principal

## ✨ Beneficios de la Refactorización

### Mantenibilidad
- ✅ Código modular y organizado
- ✅ Responsabilidad única por módulo
- ✅ Fácil localización de bugs
- ✅ Código más legible y documentado

### Escalabilidad
- ✅ Fácil agregar nuevas funcionalidades
- ✅ Módulos independientes y reutilizables
- ✅ Preparado para crecer sin complejidad

### Rendimiento
- ✅ Carga de módulos ES6 (tree-shaking)
- ✅ Mejor caché del navegador
- ✅ Separación de concerns

### Colaboración
- ✅ Múltiples desarrolladores pueden trabajar en paralelo
- ✅ Menos conflictos en control de versiones
- ✅ Código autodocumentado

## 🚀 Cómo Usar

### Desarrollo Local

1. **Iniciar el servidor:**
   ```bash
   node server.js
   ```

2. **Abrir en el navegador:**
   ```
   http://localhost:3000
   ```

### Modificar la Configuración

Para cambiar la URL del backend en producción, editar `js/config.js`:

```javascript
// Línea ~18
return 'https://tu-backend.railway.app/api'; // ⚠️ CAMBIAR ESTA URL
```

## 📝 Notas Importantes

### Uso de Módulos ES6
- Los archivos JavaScript ahora usan `import/export`
- El HTML carga el script principal con `type="module"`
- Los navegadores modernos soportan esto nativamente
- No se requiere bundler para desarrollo

### Compatibilidad
- ✅ Chrome, Firefox, Safari, Edge (versiones modernas)
- ❌ Internet Explorer (no soporta módulos ES6)

### Archivo Original
- El archivo `app.js` original se guardó en `backup/app.js.old`
- Puedes recuperarlo si es necesario para referencia

## 🛠️ Próximos Pasos Sugeridos

1. **Testing**: Agregar tests unitarios por módulo
2. **TypeScript**: Migrar a TypeScript para type safety
3. **Build Process**: Configurar Webpack/Vite para producción
4. **Componentes**: Considerar usar un framework (React/Vue/Svelte)
5. **PWA**: Convertir en Progressive Web App

## 📚 Convenciones de Código

- Usar **camelCase** para variables y funciones
- Usar **PascalCase** para clases (si se agregan)
- Comentarios en español
- Funciones documentadas con JSDoc cuando sea necesario
- Nombres descriptivos y explícitos

## 🐛 Debugging

Para debuggear un módulo específico:

1. Abrir DevTools del navegador (F12)
2. Ir a la pestaña "Sources"
3. Navegar a `js/[nombre-modulo].js`
4. Colocar breakpoints según necesites

## 📞 Soporte

Si encuentras algún problema con la refactorización:
- Verifica la consola del navegador para errores
- Asegúrate de que todos los archivos estén en la carpeta `js/`
- Comprueba que el servidor esté corriendo
- Revisa el archivo de respaldo si necesitas comparar

---

**Última actualización:** Noviembre 2025
**Versión:** 2.0 (Modular)

