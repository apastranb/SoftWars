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
<<<<<<< HEAD
# Abrir .env y completar MONGODB_URI con la cadena de conexión real
# y SESSION_SECRET con una cadena aleatoria larga
=======
# Editar .env con las credenciales reales de MongoDB Atlas
>>>>>>> d5c3747916cd03dee894f50b02358aec40d3ddee

# 4. Poblar la base de datos con datos de prueba (solo la primera vez)
node utils/seed.js

# 5. Iniciar el servidor
npm start
```

<<<<<<< HEAD
El servidor queda disponible en `http://localhost:3000`.

> **Importante:** el archivo `.env` contiene credenciales reales y **nunca** debe subirse al repositorio. El `.gitignore` ya lo excluye.

---
=======
El servidor se ejecuta en `http://localhost:3000`.

## Configuración de MongoDB Atlas

1. Crear un clúster M0 en MongoDB Atlas.
2. Crear un usuario de base de datos y agregar la IP `0.0.0.0/0.0.0` como acceso de red.
3. Copiar la cadena de conexión del botón "Connect" y pegarla en `.env`:

```env
MONGODB_URI=mongodb+srv://<usuario>:<password>@<cluster>/<db>?retryWrites=true&w=majority
DB_NAME=softwars_eventos
PORT=3000
SESSION_SECRET=...valor-secreto...
```

### Comandos de infraestructura

```bash
# Crear índices
node -e "require('./utils/crearIndices')"

# Poblar datos iniciales (seed)
node -e "require('./utils/seed').seedDB()"
```

> Si la conexión de Atlas falla por SSL en este entorno, verificar que la versión de OpenSSL/Node sea compatible y que la IP de acceso en Atlas esté habilitada.
>>>>>>> d5c3747916cd03dee894f50b02358aec40d3ddee

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
| `npm start` | Inicia el servidor en el puerto 3000 |
| `npm install` | Instala las dependencias del proyecto |
| `node utils/seed.js` | Carga datos de prueba en MongoDB (requiere `.env` configurado) |

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

## Licencia

Proyecto académico — Universidad CENFOTEC © 2026
