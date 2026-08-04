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
- **Base de datos:** MongoDB (Fase 2)
- **Otros:** dotenv (variables de entorno)

## Requisitos

- [Node.js](https://nodejs.org/) v18 o superior
- npm (incluido con Node.js)

## Instalación

```bash
# Clonar el repositorio
git clone https://github.com/apastranb/SoftWars.git
cd SoftWars

# Instalar dependencias
npm install

# Crear archivo de variables de entorno
cp .env.example .env
# (Editar .env con las credenciales de MongoDB)

# Iniciar el servidor
npm start
```

El servidor se ejecuta en `http://localhost:3000`

## Estructura del Proyecto

```
SoftWars/
├── server.js              → Servidor Express (punto de entrada)
├── package.json           → Dependencias y scripts
├── .env                   → Variables de entorno (no se sube a git)
├── .gitignore
├── README.md
├── public/                → Archivos estáticos (frontend)
│   ├── index.html         → Landing page pública
│   ├── css/               → Hojas de estilo
│   │   ├── styles.css     → Estilos globales + tokens de color
│   │   ├── admin-layout.css → Layout compartido del panel admin
│   │   └── [página].css   → Estilos específicos por página
│   ├── js/                → Lógica del cliente
│   │   ├── data-store.js  → Datos mock (será reemplazado por MongoDB)
│   │   ├── validaciones.js → Validaciones centralizadas
│   │   └── [página]-logic.js → Lógica específica por página
│   ├── pages/             → Páginas HTML
│   ├── img/               → Imágenes y assets
│   └── fonts/             → Tipografías locales
└── node_modules/          → Dependencias (generado por npm install)
```

## Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm start` | Inicia el servidor en el puerto 3000 |
| `npm install` | Instala las dependencias del proyecto |

## Credenciales de prueba (desarrollo)

| Email | Contraseña |
|---|---|
| ccarballov@ucenfotec.ac.cr | Crbl#2026x |
| kgamboas@ucenfotec.ac.cr | Knnr$2026z |
| apastranb@ucenfotec.ac.cr | Dnsp%2026w |
| jarroyor@ucenfotec.ac.cr | Jsrr&2026v |

> Las contraseñas cumplen con RF-02: 8-16 caracteres, sin vocales, con mayúscula, minúscula, número y carácter especial.

## Módulos del Sistema

- **Eventos** — Gestión de eventos principales
- **Actividades** — Subeventos asociados a un evento padre
- **Presentadores** — Oradores y responsables de actividades
- **Stands** — Espacios de promoción dentro de eventos
- **Participantes** — Asistentes inscritos desde el portal público
- **Administradores** — Gestión de cuentas con acceso al panel

## Licencia

Proyecto académico — Universidad CENFOTEC © 2026
