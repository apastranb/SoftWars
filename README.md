# Sistema de Gestión de Eventos UCENFOTEC

Aplicación web para la administración y divulgación de eventos académicos, culturales, tecnológicos y recreativos de la Universidad CENFOTEC.

## Equipo SoftWars

| Integrante | Rol |
|---|---|
| Josué Arroyo | Coordinador |
| Carlos Carballo | Líder Técnico |
| Adonis Pastrana | Infraestructura |
| Kenner Gamboa | Líder QA |

**Curso:** Proyecto Integrador 1  
**Profesor:** Alvaro Cordero Peña  
**Período:** C2 - 2026

## Tecnologías

- **Frontend:** HTML5, CSS3, JavaScript (Vanilla), Bootstrap 5, Bootstrap Icons, SweetAlert2
- **Backend:** Node.js, Express
- **Base de datos:** MongoDB Atlas (clúster M0 compartido)
- **Otros:** dotenv, bcrypt, express-session

## Requisitos

- [Node.js](https://nodejs.org/) v18 o superior
- npm (incluido con Node.js)
- Acceso al clúster MongoDB Atlas del equipo (ver sección siguiente)

## Configuración de MongoDB Atlas (SW-1 / SW-2)

> Estos pasos los realiza el responsable de infraestructura (Adonis Pastrana) una sola vez.

### 1. Crear la cuenta y el clúster

1. Ir a [https://cloud.mongodb.com](https://cloud.mongodb.com) y crear una cuenta gratuita.
2. Crear un nuevo proyecto llamado **SoftWars**.
3. Dentro del proyecto, hacer clic en **Build a Database** y seleccionar el tier **M0 Free**.
4. Elegir el proveedor y región más cercana (por ejemplo AWS / São Paulo).
5. Nombrar el clúster **softwars** y hacer clic en **Create**.

### 2. Crear el usuario de base de datos

1. En el panel izquierdo ir a **Security → Database Access**.
2. Hacer clic en **Add New Database User**.
3. Elegir autenticación por contraseña.
4. Crear un usuario con nombre `softwars_app` y una contraseña segura (generarla con el botón **Autogenerate**).
5. Asignar el rol **Atlas admin** o **readWrite** sobre la base de datos `softwars_eventos`.
6. Guardar el usuario.

### 3. Configurar las reglas de acceso de red

1. En el panel izquierdo ir a **Security → Network Access**.
2. Hacer clic en **Add IP Address**.
3. Durante el desarrollo, agregar `0.0.0.0/0` (acceso desde cualquier IP) o las IPs fijas del equipo.
4. Confirmar con **Confirm**.

### 4. Obtener la cadena de conexión

1. En la pantalla del clúster hacer clic en **Connect → Drivers**.
2. Seleccionar **Node.js** y copiar la URI. Tiene el formato:
   ```
   mongodb+srv://softwars_app:<password>@softwars.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
3. Reemplazar `<password>` con la contraseña del paso 2.
4. Esta URI va en el archivo `.env` local de cada integrante (ver sección de instalación).

---

## Instalación local

```bash
# 1. Clonar el repositorio
git clone https://github.com/apastranb/SoftWars.git
cd SoftWars

# 2. Instalar dependencias
npm install

# 3. Crear el archivo de variables de entorno
cp .env.example .env
# Abrir .env y completar MONGODB_URI con la cadena de conexión real
# y SESSION_SECRET con una cadena aleatoria larga

# 4. Crear los índices de las siete colecciones (solo la primera vez)
node -e "require('./utils/crearIndices')"

# 5. Poblar la base de datos con datos de prueba (solo la primera vez)
node utils/seed.js

# 6. Iniciar el servidor
npm start
```

El servidor queda disponible en `http://localhost:3000`.

> **Importante:** el archivo `.env` contiene credenciales reales y **nunca** debe subirse al repositorio. El `.gitignore` ya lo excluye.

> Si la conexión con Atlas falla por SSL, verificar que la versión de Node sea compatible y que la IP del equipo esté habilitada en **Network Access**.

---

## Ejecutar sin MongoDB Atlas (modo demostración)

Levanta la aplicación completa contra un doble de MongoDB **en memoria**, con datos de
ejemplo ya cargados. No necesita credenciales, ni red, ni clúster:

```bash
npm run demo
```

| | |
|---|---|
| URL | <http://localhost:3001> |
| Usuario | `admin@ucenfotec.ac.cr` |
| Contraseña | `Admin123!` |

Sirve para revisar pantallas durante el desarrollo y como plan B si la red del
laboratorio bloquea la salida hacia Atlas. Los datos viven en memoria y se pierden al
detener el proceso: **no sustituye a `npm start` contra Atlas**.

---

## Asistente de IA (SW-25)

El botón **"Mejorar con IA"** del formulario de eventos reescribe la descripción usando
la API de Gemini. La clave vive **solo en el servidor**: el navegador llama a
`POST /api/asistente/descripcion` y es Express quien contacta a Google, de modo que la
credencial nunca viaja al cliente.

Para habilitarlo, obtener una clave en [Google AI Studio](https://aistudio.google.com/apikey)
y agregarla al `.env`:

```env
GEMINI_API_KEY=tu_clave_aqui
GEMINI_MODEL=gemini-flash-latest
```

Si la variable queda vacía, el endpoint responde `503` con un aviso entendible y **el
resto del sistema funciona con normalidad**.

> **Recordar:** el `.env` real está en `.gitignore`. Nunca escribir la clave en
> `.env.example`, que sí se sube a GitHub.

### Dos cosas que costaron encontrar

**Usar el alias `gemini-flash-latest`, no una versión fija.** Con `gemini-2.0-flash` la
API devuelve `429 RESOURCE_EXHAUSTED` con `limit: 0`, aunque la clave sea válida y no se
haya gastado ninguna petición: ese modelo concreto no tiene asignación en el nivel
gratuito del proyecto. El alias sí responde. Si aparece ese error, el problema es el
nombre del modelo, no la clave.

**El presupuesto de tokens tiene que ser holgado.** Los modelos flash actuales razonan
antes de responder, y esos tokens de razonamiento consumen el mismo `maxOutputTokens`
que la respuesta. Con 256, el modelo gastaba unos 241 pensando y devolvía la frase
cortada a media palabra. Está fijado en 2048; la descripción final ocupa unos 30 tokens
y el resto es margen. Si aun así llega truncada, el servidor lo detecta por
`finishReason: MAX_TOKENS` y responde 502 en vez de entregar una frase incompleta.

Para diagnosticar la clave sin pasar por la aplicación, `npm test` cubre los casos de
error (sin clave, cuota agotada, respuesta truncada) con la respuesta de Google simulada.

---

## Endpoints de la API

Las rutas marcadas con 🔒 exigen sesión de administrador (`middleware/auth.js`).

| Recurso | Método y ruta | Descripción |
|---|---|---|
| Autenticación | `POST /api/auth/login` | Iniciar sesión (bcrypt) |
| | `POST /api/auth/logout` 🔒 | Cerrar sesión |
| | `GET /api/auth/sesion` | Consultar la sesión activa |
| | `PUT /api/auth/contrasena` | Modificar contraseña |
| Eventos | `GET /api/eventos` | Listado con búsqueda y filtros |
| | `GET /api/eventos/:id` | Detalle por `_id` o código |
| | `GET /api/eventos/agenda/:eventoId` | Agenda del evento |
| | `POST · PUT · DELETE` 🔒 | Alta, edición y baja |
| Actividades | `GET /api/actividades` | Listado con filtros |
| | `POST · PUT · DELETE` 🔒 | Alta, edición y baja |
| Presentadores | `GET /api/oradores` | Listado (RF-20) |
| | `GET /api/oradores/:id` | Detalle por `_id` o código `OR-001` |
| | `POST /api/oradores` 🔒 | Registro (RF-12) |
| | `PUT /api/oradores/:id` 🔒 | Edición condicional (RF-13) |
| | `PATCH /api/oradores/:id/estado` 🔒 | Activar / desactivar |
| | `DELETE /api/oradores/:id` 🔒 | Eliminación condicional (RF-13) |
| Stands | `GET /api/stands` | Listado y filtros (RF-22) |
| | `POST /api/stands` 🔒 | Registro con numeración anual (RF-15) |
| | `PUT /api/stands/:id` 🔒 | Edición limitada (RF-16) |
| | `PATCH /api/stands/:id/estado` 🔒 | Aprobado / Cerrado |
| | `DELETE /api/stands/:id` 🔒 | Baja |
| Postulaciones | `POST /api/postulaciones` | Solicitud pública (RF-24, RF-25) |
| | `GET /api/postulaciones` 🔒 | Bandeja del panel |
| | `PATCH /api/postulaciones/:id/aprobar` 🔒 | Aprobar y crear el orador (HU-10) |
| | `PATCH /api/postulaciones/:id/rechazar` 🔒 | Rechazar con motivo (HU-10) |
| | `DELETE /api/postulaciones/:id` 🔒 | Descartar |
| Participantes | `GET · POST /api/participantes` | Inscripciones desde el portal |
| Inscripciones | `GET /api/inscripciones` 🔒 | Vista global |
| Asistente IA | `POST /api/asistente/descripcion` 🔒 | Mejora la descripción con Gemini |

### Reglas de negocio que hace cumplir el servidor

| Regla | Comportamiento |
|---|---|
| **RF-13** | Editar o eliminar un presentador con actividades vigentes devuelve `409`. Desactivarlo sí se permite. |
| **RF-15** | El ID de stand lo asigna la base de datos con un contador atómico por año: `S-2026-001`, y vuelve a `001` cada enero. |
| **RF-16** | Cambiar el correo o el ID de un stand devuelve `400`. |
| **RF-25** | Un mismo correo no puede postularse dos veces a la misma actividad, pero sí a actividades distintas. |

---

## Estructura del Proyecto

```
SoftWars/
├── server.js                  → Servidor Express (punto de entrada)
├── package.json               → Dependencias y scripts
├── .env                       → Variables de entorno (NO se versiona)
├── .env.example               → Plantilla de variables (sí se versiona)
├── .gitignore
├── README.md
├── config/
│   └── db.js                  → Conexión a MongoDB Atlas e índices
├── routes/                    → Endpoints por recurso
├── controllers/               → Lógica de negocio por recurso
├── middleware/
│   ├── auth.js                → Verificación de sesión
│   ├── auditoria.js           → Inyección automática de metadatos (RF-29)
│   └── errores.js             → Manejo centralizado de errores
├── utils/
│   ├── catalogos.js           → Valores permitidos por catálogo
│   ├── codigos.js             → Generación atómica de códigos únicos
│   ├── crearIndices.js        → Definición e instalación de índices
│   ├── auditoria.js           → sellarAuditoria() (RF-29)
│   ├── mongo.js               → Helpers de acceso a MongoDB
│   ├── respuestas.js          → Helpers de respuesta HTTP
│   ├── seed.js                → Carga inicial de datos de prueba
│   └── validaciones.server.js → Reglas de validación del servidor
├── pruebas/
│   ├── humo.js                → Pruebas de humo de las APIs (npm test)
│   ├── mongo-en-memoria.js    → Doble del driver de MongoDB para pruebas
│   └── servidor-demo.js       → App completa sin Atlas (npm run demo)
└── public/                    → Frontend servido como estático
    ├── index.html
    ├── css/
    ├── js/
    ├── pages/
    ├── img/
    └── fonts/
```

## Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm install` | Instala las dependencias del proyecto |
| `npm start` | Inicia el servidor contra MongoDB Atlas en el puerto 3000 |
| `npm run demo` | Levanta la app con MongoDB en memoria y datos de ejemplo (puerto 3001) |
| `npm test` | Ejecuta las pruebas de humo de las APIs (68 casos, no requiere Atlas) |
| `node utils/seed.js` | Carga datos de prueba en MongoDB (requiere `.env` configurado) |
| `node -e "require('./utils/crearIndices')"` | Crea los índices de las siete colecciones |

## Credenciales de prueba (desarrollo)

Las contraseñas de los usuarios de prueba se generan y almacenan cifradas con bcrypt al ejecutar `node utils/seed.js`. Para obtener una contraseña temporal, contactar al responsable de infraestructura.

> Las contraseñas cumplen con RF-02: 8-16 caracteres, sin vocales, con mayúscula, minúscula, número y carácter especial.

## Módulos del Sistema

- **Eventos** — Gestión de eventos principales
- **Actividades** — Subeventos asociados a un evento padre
- **Presentadores** — Oradores y responsables de actividades
- **Stands** — Espacios de promoción dentro de eventos
- **Participantes** — Asistentes inscritos desde el portal público
- **Administradores** — Gestión de cuentas con acceso al panel
- **Asistente de IA** — Mejora de descripciones de eventos con Gemini

## Estado de la migración a la API (hito SW-22)

> Corte: 5 de agosto de 2026 · Seguimiento: Josué Arroyo (Coordinador)

**El hito "la aplicación funciona sin `data-store.js`" todavía no se cumple.** De los
doce módulos del frontend, cuatro consumen la API REST y ocho siguen leyendo y
escribiendo en `window.db` (el `localStorage` de la iteración 1).

El backend, en cambio, está completo: las siete colecciones tienen controllers, rutas,
validación de servidor, índices y seed. Lo que falta no es API, es **cablear las
pantallas** que todavía apuntan a `data-store.js`.

El bloqueante principal ya está resuelto: `login` autentica contra la API, así que las
pantallas migradas por fin obtienen una sesión de servidor. Antes de eso, cualquier
pantalla migrada rebotaba al login aunque el usuario hubiera entrado bien.

### Estado por módulo

| Módulo | Fuente de datos | Responsable | Estado |
|---|---|---|---|
| `login` | API REST | Kenner (SW-10), migrado por Josué | ✅ Migrado |
| `admin-oradores` | API REST | Josué (SW-12 / SW-27) | ✅ Migrado |
| `admin-stands` | API REST | Josué (SW-14 / SW-27) | ✅ Migrado |
| `admin-participantes` | API REST | Kenner (SW-16) | ✅ Migrado |
| `detalle-evento` | `window.db` ×7 | Carlos (SW-23) | ⚠️ Mixto |
| `admin-crear-evento` | `window.db` ×2 | Carlos (SW-9) | ⚠️ Mixto — solo el asistente de IA usa la API |
| `admin-actividades` | `window.db` ×27 | Carlos (SW-13) | ⛔ Pendiente — el más grande |
| `admin-usuarios` | `window.db` ×10 | Kenner | ⛔ Pendiente |
| `admin-eventos` | `window.db` ×5 | Carlos (SW-9) | ⛔ Pendiente |
| `postular-participante` | `window.db` ×5 | Kenner (SW-28) | ⛔ Pendiente |
| `pago` | `window.db` ×2 | Kenner (SW-28) | ⛔ Pendiente |
| `index` | `window.db` ×1 | Carlos (SW-23) | ⛔ Pendiente |

Para reproducir el conteo:

```bash
grep -c "window.db" public/js/*-logic.js
```

El hito se cierra cuando `grep -r "data-store" public/` no devuelve nada y el archivo
`public/js/data-store.js` se puede borrar. Hoy nueve páginas todavía lo cargan.

### Puente temporal de sesión

`login.html` autentica contra `POST /api/auth/login` con bcrypt, y la sesión vive en una
cookie httpOnly del servidor. **Esa es la sesión real.**

Pero cinco pantallas (`admin-eventos`, `admin-actividades`, `admin-crear-evento`,
`admin-participantes`, `admin-usuarios`) todavía se guardan con
`localStorage.getItem('sesionActiva')`. Sin esa bandera rebotarían al login en un bucle
infinito, así que `login-logic.js` la escribe además de crear la sesión de servidor.
No es una credencial: quien decide si hay sesión es siempre `GET /api/auth/sesion`.

Al migrar cada una de esas cinco pantallas, cambiar su guardia por `await apiSesion()`
(ver `admin-oradores-logic.js` como referencia). Cuando las cinco estén migradas, borrar
las cuatro líneas marcadas con `PUENTE TEMPORAL (SW-22)` en `login-logic.js`.

**Hueco conocido:** el botón "Cerrar Sesión" de esas cinco pantallas solo borra el
`localStorage`; no llama a `POST /api/auth/logout`, así que la cookie del servidor
sobrevive hasta expirar (8 horas). Se cierra solo al migrar cada pantalla.

### Riesgos de integración abiertos

**1. Tres formatos de respuesta conviviendo (alto).** Los listados no devuelven la misma
forma según quién escribió el controller:

| Recurso | Forma de la respuesta |
|---|---|
| `eventos`, `actividades` | `{ data: [...] }` |
| `oradores`, `stands`, `postulaciones` | `[...]` (arreglo plano) |
| `participantes`, `inscripciones` | `{ error: false, participantes: [...] }` |

Esto era lo que SW-4 debía dejar acordado. Cada pantalla que se migre tiene que adivinar
la forma correcta. **Mitigación:** `public/js/api.js` incorpora el helper
`listaDe(respuesta)`, que acepta las tres y siempre devuelve un arreglo; las pantallas
pendientes deben usarlo en vez de asumir una forma. Unificar los controllers queda como
deuda técnica para después de la defensa.

**2. Funciones compartidas borradas en un merge (resuelto).**
`utils/validaciones.server.js` perdió `validarEnCatalogo()` y `normalizarTelefono()` en
los commits del 3 de agosto. Consecuencia: crear un evento, una actividad o un stand
respondía HTTP 500, porque cuatro controllers llamaban a funciones que ya no se
exportaban. Se restauraron y las pruebas volvieron a verde. **Lección para SW-41:** ese
archivo lo usan los cuatro integrantes; correr `npm test` antes de cada push.

**3. Cobertura de pruebas desigual.** `pruebas/humo.js` cubre 68 casos, todos de
oradores, stands, postulaciones y el asistente de IA. Eventos, actividades,
participantes, inscripciones y autenticación no tienen red de seguridad automática. Es
el alcance de SW-34.

### Orden de trabajo pendiente

1. ~~`login` — migrar a `POST /api/auth/login`.~~ ✅ Hecho el 4/08.
2. `admin-eventos` + `admin-crear-evento` (Carlos) — sin eventos no hay actividades ni stands.
3. `admin-actividades` (Carlos) — el módulo más grande, 27 referencias.
4. `index` + `detalle-evento` (Carlos) — portal público, es lo que se ve en la defensa.
5. `postular-participante` + `pago` (Kenner).
6. `admin-usuarios` (Kenner).
7. Quitar `data-store.js` de las páginas restantes y borrar el archivo.

## Licencia

Proyecto académico — Universidad CENFOTEC © 2026
