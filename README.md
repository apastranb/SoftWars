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

- **Frontend:** HTML5, CSS3, JavaScript ES Modules, Bootstrap 5, SweetAlert2
- **Backend:** Node.js, Express
- **Base de datos:** MongoDB Atlas (driver nativo)
- **Otros:** dotenv, bcryptjs, express-session

## Requisitos

- Node.js v18 o superior
- npm (incluido con Node.js)
- Acceso al clúster MongoDB Atlas del equipo

## Instalación

```bash
# Clonar el repositorio
git clone https://github.com/apastranb/SoftWars.git
cd SoftWars

# Instalar dependencias
npm install

# Crear el archivo de variables de entorno
cp .env.example .env
# Editar .env con la cadena de conexión a MongoDB y un SESSION_SECRET

# Iniciar el servidor
npm start
```

El servidor queda disponible en `http://localhost:3000`.

## Variables de entorno (.env)

| Variable | Descripción |
|---|---|
| MONGODB_URI | Cadena de conexión al clúster de MongoDB Atlas |
| DB_NAME | Nombre de la base de datos (softwars_eventos) |
| PORT | Puerto del servidor (3000) |
| SESSION_SECRET | Cadena aleatoria para firmar la cookie de sesión |
| BCRYPT_ROUNDS | Rondas de cifrado (10) |
| GEMINI_API_KEY | Clave de API de Google Gemini (opcional) |
| GEMINI_MODEL | Modelo a usar (gemini-flash-latest) |

## Credenciales de acceso

Para obtener credenciales de acceso al sistema, contactar a cualquier integrante del equipo SoftWars.

## Estructura del Proyecto

```
SoftWars/
├── server.js                      → Punto de entrada (Express)
├── package.json
├── .env.example
├── .gitignore
├── README.md
│
├── backend/
│   ├── config/
│   │   └── db.js                  → Conexión a MongoDB Atlas
│   ├── controllers/               → Reciben req/res, validan, llaman al service
│   ├── services/                  → Lógica de negocio y operaciones MongoDB
│   ├── models/                    → Constantes, campos permitidos, defaults
│   ├── routes/                    → Definición de endpoints por recurso
│   ├── middleware/
│   │   ├── auth.js                → Verificación de sesión
│   │   └── errores.js             → Manejo centralizado de errores
│   └── utils/
│       ├── catalogos.js           → Valores permitidos del sistema
│       ├── codigos.js             → Generación atómica de códigos
│       ├── validaciones.server.js → Reglas de validación del servidor
│       ├── auditoria.js           → Metadatos RF-29 (createdAt, updatedAt)
│       ├── mongo.js               → Helpers de MongoDB
│       └── respuestas.js          → Helpers de respuesta HTTP
│
└── public/                        → Frontend (servido como estático)
    ├── index.html
    ├── pages/                     → Páginas HTML
    ├── css/                       → Estilos (styles.css + por página)
    ├── img/                       → Imágenes
    ├── fonts/                     → Tipografías
    └── js/
        ├── controllers/           → Lógica de cada página (ES modules)
        ├── services/              → Comunicación HTTP con la API (ES modules)
        ├── models/                → Armado de objetos desde formularios
        └── validaciones.js        → Reglas de validación del cliente (global)
```

## Arquitectura

```
┌─────────────────────────────────────────────────────┐
│  FRONTEND (public/)                                 │
│  controllers/ → services/ → fetch() a la API       │
└─────────────────────┬───────────────────────────────┘
                      │ HTTP (JSON)
┌─────────────────────▼───────────────────────────────┐
│  BACKEND (backend/)                                 │
│  routes/ → controllers/ → services/ → MongoDB      │
└─────────────────────────────────────────────────────┘
```

## Endpoints de la API

Las rutas con 🔒 requieren sesión de administrador.

| Recurso | Endpoints |
|---|---|
| Auth | `POST /api/auth/login`, `POST /api/auth/logout` 🔒, `GET /api/auth/sesion` |
| Eventos | `GET /api/eventos`, `GET /api/eventos/:id`, `POST` 🔒, `PUT/:id` 🔒, `DELETE/:id` 🔒 |
| Actividades | `GET /api/actividades`, `POST` 🔒, `PUT/:id` 🔒, `DELETE/:id` 🔒 |
| Oradores | `GET /api/oradores`, `POST` 🔒, `PUT/:id` 🔒, `PATCH/:id/estado` 🔒, `DELETE/:id` 🔒 |
| Stands | `GET /api/stands`, `POST` 🔒, `PUT/:id` 🔒, `PATCH/:id/estado` 🔒, `DELETE/:id` 🔒 |
| Participantes | `GET` 🔒, `PUT/:id` 🔒, `DELETE/:id` 🔒 |
| Inscripciones | `POST /api/inscripciones`, `GET` 🔒, `DELETE/:id` |
| Postulaciones | `POST /api/postulaciones`, `GET` 🔒, `PATCH/:id/aprobar` 🔒, `PATCH/:id/rechazar` 🔒 |
| Usuarios | `GET` 🔒, `POST` 🔒, `PUT/:id` 🔒, `DELETE/:id` 🔒 |
| Agenda | `GET /api/eventos/agenda/:eventoId` |
| Asistente IA | `POST /api/asistente/descripcion` 🔒 |

## Módulos del Sistema

- **Eventos** — Gestión de eventos principales
- **Actividades** — Subeventos vinculados a un evento padre
- **Presentadores** — Oradores y responsables de actividades
- **Stands** — Espacios de promoción dentro de eventos
- **Participantes** — Asistentes inscritos desde el portal público
- **Postulaciones** — Solicitudes públicas para ser presentador
- **Administradores** — Gestión de cuentas con acceso al panel
- **Asistente de IA** — Mejora de descripciones con Google Gemini

## Licencia

Proyecto académico — Universidad CENFOTEC © 2026
