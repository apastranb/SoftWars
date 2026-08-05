# SW-22 — Estado del hito "la aplicación funciona sin data-store.js"

**Responsable:** Josué Arroyo (Coordinador)
**Fecha de corte:** 4 de agosto de 2026
**Entrega comprometida:** sábado 8 de agosto de 2026

---

## Veredicto

**El hito NO se cumple todavía.** De los doce módulos del frontend, cuatro consumen la
API REST y ocho siguen leyendo y escribiendo en `window.db` (localStorage).

El bloqueante principal **ya está resuelto**: `login` autentica contra la API, así que
las pantallas migradas por fin pueden obtener una sesión de servidor. Antes de esto,
cualquier pantalla migrada rebotaba al login aunque el usuario hubiera entrado bien.

El backend, en cambio, sí está completo: las siete colecciones tienen controllers,
rutas, validación de servidor, índices y seed. El trabajo que falta no es de API,
es de **cablear las pantallas** que todavía apuntan a `data-store.js`.

---

## Estado por módulo

| Módulo | Fuente de datos | Responsable de migrarlo | Estado |
|---|---|---|---|
| `admin-oradores` | API REST | Josué (SW-27) | ✅ Migrado |
| `admin-stands` | API REST | Josué (SW-27) | ✅ Migrado |
| `admin-participantes` | API REST | Kenner (SW-16) | ✅ Migrado — falta quitar el `<script>` de `data-store.js` de la página |
| `login` | API REST | Kenner (SW-10), migrado por Josué | ✅ Migrado — ver "Puente temporal" abajo |
| `admin-actividades` | `window.db` ×27 | Carlos (SW-13) | ⛔ Pendiente — el más grande |
| `admin-usuarios` | `window.db` ×10 | Kenner | ⛔ Pendiente |
| `detalle-evento` | `window.db` ×7 | Carlos (SW-23) | ⛔ Pendiente |
| `admin-eventos` | `window.db` ×5 | Carlos (SW-9) | ⛔ Pendiente |
| `postular-participante` | `window.db` ×5 | Kenner (SW-28) | ⛔ Pendiente |
| `admin-crear-evento` | `window.db` ×2 | Carlos (SW-9) | ⛔ Pendiente |
| `pago` | `window.db` ×2 | Kenner (SW-28) | ⛔ Pendiente |
| `index` | `window.db` ×1 | Carlos (SW-23) | ⛔ Pendiente |

### Puente temporal de sesión

`login.html` ya autentica contra `POST /api/auth/login` con bcrypt y la sesión vive
en una cookie httpOnly del servidor. **Esa es la sesión real.**

Pero cinco pantallas (`admin-eventos`, `admin-actividades`, `admin-crear-evento`,
`admin-participantes`, `admin-usuarios`) todavía se guardan con
`localStorage.getItem('sesionActiva')`. Si el login no escribiera esa bandera,
rebotarían al login en un bucle infinito. Por eso `login-logic.js` la escribe
además de crear la sesión de servidor.

**Al migrar cada una de esas cinco pantallas**, cambiar su guardia por
`await apiSesion()` (ver `admin-oradores-logic.js` como referencia). Cuando las
cinco estén migradas, borrar las cuatro líneas de `localStorage.setItem` marcadas
con `PUENTE TEMPORAL (SW-22)` en `login-logic.js`.

**Hueco conocido:** el botón "Cerrar Sesión" de esas cinco pantallas antiguas solo
borra el `localStorage`; no llama a `POST /api/auth/logout`, así que la cookie del
servidor sobrevive. En la práctica el usuario sale de la aplicación, pero la sesión
del servidor sigue viva hasta que expire (8 horas). Se cierra solo al migrar cada
pantalla.

Comando para reproducir este conteo:

```bash
grep -c "window.db" public/js/*-logic.js
```

---

## Riesgos abiertos

### 1. Tres formatos de respuesta distintos conviviendo (alto)

Los listados de la API no devuelven la misma forma según quién escribió el controller:

| Recurso | Forma de la respuesta |
|---|---|
| `eventos`, `actividades` | `{ data: [...] }` |
| `oradores`, `stands`, `postulaciones` | `[...]` (arreglo plano) |
| `participantes`, `inscripciones` | `{ error: false, participantes: [...] }` |

Esto era justamente lo que SW-4 debía dejar acordado. Cada pantalla que se migre
tiene que adivinar la forma correcta, y es una fuente segura de bugs de última hora.

**Mitigación aplicada:** `public/js/api.js` incorpora el helper `listaDe(respuesta)`,
que acepta las tres formas y siempre devuelve un arreglo. Las pantallas que faltan
deben usarlo en lugar de asumir una forma concreta.

**Decisión:** no se unifican los controllers antes de la entrega. Tocar los tres
módulos a la vez, a cuatro días del cierre y con trabajo en curso de los cuatro
integrantes, tiene más riesgo que el helper. Queda como deuda técnica documentada.

### 2. Funciones compartidas borradas en un merge (resuelto)

`utils/validaciones.server.js` perdió `validarEnCatalogo()` y `normalizarTelefono()`
en los commits del 3 de agosto. Consecuencia: **crear un evento, una actividad o un
stand respondía HTTP 500**, porque los cuatro controllers llamaban a una función que
ya no se exportaba. Se restauraron ambas y las pruebas de humo volvieron a verde.

**Lección para SW-41:** este archivo lo usan los cuatro. Cualquier cambio ahí debe
pasar por revisión antes de fusionar, y `npm test` debe correr antes de cada push.

### 3. Las pruebas de humo no cubren los módulos de los compañeros

`pruebas/humo.js` cubre 68 casos, todos de oradores, stands, postulaciones y el
asistente de IA. Eventos, actividades, participantes, inscripciones y autenticación
no tienen red de seguridad automática. Es el alcance de SW-34 (Kenner).

---

## Camino crítico hasta el sábado 8

El orden importa: `login` primero, porque mientras la sesión viva en `localStorage`
ninguna pantalla migrada puede autenticarse contra la API.

1. ~~**`login`** — cambiar a `POST /api/auth/login` y cookie de sesión.~~ ✅ Hecho el 4/08.
2. **`admin-eventos` + `admin-crear-evento`** (Carlos) — sin eventos no hay actividades ni stands.
3. **`admin-actividades`** (Carlos) — el módulo más grande, 27 referencias.
4. **`index` + `detalle-evento`** (Carlos) — portal público, es lo que se ve en la defensa.
5. **`postular-participante` + `pago`** (Kenner).
6. **`admin-usuarios`** (Kenner).
7. Quitar `data-store.js` de las doce páginas y **borrar el archivo**. El hito se cierra
   cuando `grep -r "data-store" public/` no devuelve nada.

---

## Cómo probar sin MongoDB Atlas

Se agregó un servidor de demostración que levanta la aplicación completa con un doble
de MongoDB en memoria y datos de ejemplo. No necesita credenciales de Atlas ni red:

```bash
npm run demo
```

Queda en <http://localhost:3001> con el usuario `admin@ucenfotec.ac.cr` / `Admin123!`.
Sirve para revisar pantallas y como plan B si la red del laboratorio bloquea Atlas
durante la defensa (SW-37).
