# 📊 Mapa de Dependencias - SkateShop

## Flujo de Importaciones

```
app.js (Principal)
├── auth.js
│   ├── api.js
│   │   ├── config.js
│   │   └── state.js
│   ├── state.js
│   ├── ui.js
│   │   └── state.js
│   └── navigation.js
│       ├── state.js
│       ├── ui.js
│       └── products.js
│
├── events.js
│   ├── ui.js
│   ├── auth.js
│   ├── products.js
│   ├── cart.js
│   ├── state.js
│   └── config.js
│
├── ui.js
└── cart.js
    ├── api.js
    ├── config.js
    ├── state.js
    └── ui.js
```

## Módulos por Nivel de Dependencia

### Nivel 0 (Sin dependencias externas)
- `config.js` - Configuración pura

### Nivel 1 (Solo dependen de config)
- `state.js` - Estado global

### Nivel 2 (Dependen de config y state)
- `api.js` - Comunicación con backend
- `ui.js` - Utilidades de interfaz

### Nivel 3 (Lógica de negocio)
- `auth.js` - Autenticación
- `products.js` - Gestión de productos
- `cart.js` - Gestión del carrito
- `navigation.js` - Navegación

### Nivel 4 (Orquestación)
- `events.js` - Event listeners globales
- `app.js` - Inicialización principal

## Líneas de Código por Módulo

| Módulo | Líneas | Responsabilidad Principal |
|--------|--------|---------------------------|
| config.js | ~30 | Configuración y constantes |
| state.js | ~80 | Gestión del estado global |
| api.js | ~120 | Llamadas HTTP a la API |
| ui.js | ~130 | Utilidades de interfaz y DOM |
| auth.js | ~80 | Login, registro, logout |
| navigation.js | ~20 | Control de vistas por rol |
| products.js | ~350 | CRUD y visualización de productos |
| cart.js | ~250 | Gestión completa del carrito |
| events.js | ~150 | Configuración de listeners |
| app.js | ~20 | Inicialización de la app |
| **TOTAL** | **~1,230** | Código modular vs ~1,500 monolítico |

## Reducción de Complejidad

### Antes (Monolítico)
- ❌ 1 archivo de ~1,500 líneas
- ❌ Difícil de mantener
- ❌ Alto acoplamiento
- ❌ Testing complicado

### Después (Modular)
- ✅ 10 módulos especializados
- ✅ Promedio de ~120 líneas por archivo
- ✅ Bajo acoplamiento
- ✅ Fácil de testear
- ✅ Código más limpio (~15% reducción por eliminación de duplicados)

## Convenciones de Importación

```javascript
// Importaciones agrupadas por tipo
import { constante1, constante2 } from './config.js';
import { funcion1, funcion2 } from './api.js';
import * as api from './api.js'; // Cuando hay muchas funciones
```

## Exports vs Imports

| Módulo | Exports | Imports de otros módulos |
|--------|---------|--------------------------|
| config.js | 4 | 0 |
| state.js | 16 | 0 |
| api.js | 12 | 2 (config, state) |
| ui.js | 8 | 1 (state) |
| auth.js | 3 | 5 (api, state, ui, navigation) |
| products.js | 5 | 4 (api, config, state, ui, cart) |
| cart.js | 4 | 4 (api, config, state, ui) |
| events.js | 1 | 7 (todos) |
| app.js | 0 | 3 (auth, events, ui, cart) |

---

Este mapa te ayuda a entender cómo fluye la información entre módulos.

