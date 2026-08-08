// ==========================================================================
// SERVIDOR EXPRESS — Sistema de Gestión de Eventos UCENFOTEC
// Punto de entrada: middleware, rutas y arranque
// ==========================================================================

'use strict';

require('dotenv').config();

const express  = require('express');
const session  = require('express-session');

const { conectarDB, cerrarDB } = require('./backend/config/db');
const { auditoriaMiddleware }  = require('./backend/utils/auditoria');
const { manejarError }         = require('./backend/middleware/errores');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware global ──────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Sesiones ───────────────────────────────────────────────────────────────
app.use(session({
    secret:            process.env.SESSION_SECRET || 'softwars_secret_dev',
    resave:            false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure:   false,
        maxAge:   1000 * 60 * 60 * 8
    }
}));

// ── Auditoría automática (RF-29) ───────────────────────────────────────────
app.use(auditoriaMiddleware);

// ── Archivos estáticos ─────────────────────────────────────────────────────
app.use(express.static('public'));

// ── Rutas API ──────────────────────────────────────────────────────────────
app.use('/api/auth',          require('./backend/routes/auth.routes'));
app.use('/api/eventos',       require('./backend/routes/eventos.routes'));
app.use('/api/actividades',   require('./backend/routes/actividades.routes'));
app.use('/api/oradores',      require('./backend/routes/oradores.routes'));
app.use('/api/stands',        require('./backend/routes/stands.routes'));
app.use('/api/participantes', require('./backend/routes/participantes.routes'));
app.use('/api/inscripciones', require('./backend/routes/inscripciones.routes'));
app.use('/api/postulaciones', require('./backend/routes/postulaciones.routes'));
app.use('/api/usuarios',      require('./backend/routes/usuarios.routes'));
app.use('/api/asistente',     require('./backend/routes/asistente.routes'));

// ── Manejo centralizado de errores ─────────────────────────────────────────
app.use(manejarError);

// ── Arranque ───────────────────────────────────────────────────────────────
async function iniciarServidor() {
    try {
        await conectarDB();
        app.listen(PORT, () => {
            console.log(`[server] Servidor corriendo en http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('[server] No se pudo conectar a MongoDB:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    iniciarServidor();
}

module.exports = app;
module.exports.cerrarDB = cerrarDB;
