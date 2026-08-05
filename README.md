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
GEMINI_MODEL=gemini-2.0-flash
```

Si la variable queda vacía, el endpoint responde `503` con un aviso entendible y **el
resto del sistema funciona con normalidad**.

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
├── docs/
│   └── ESTADO-SW-22.md        → Estado del hito y riesgos de integración
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

## Estado de la migración a la API

El backend está completo, pero parte del frontend todavía lee de `data-store.js`
(localStorage de la iteración 1). El detalle por módulo, los riesgos de integración
abiertos y el orden de trabajo pendiente están en
[`docs/ESTADO-SW-22.md`](docs/ESTADO-SW-22.md).

## Licencia

Proyecto académico — Universidad CENFOTEC © 2026
