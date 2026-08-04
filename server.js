// ==========================================================================
// SERVIDOR EXPRESS — Sistema de Gestión de Eventos UCENFOTEC
// Punto de entrada: middleware, rutas y arranque
// ==========================================================================

require('dotenv').config();
const express = require('express');
const session = require('express-session');
const app = express();
const PORT = process.env.PORT || 3000;

// --- Middleware global ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Sesiones (SW-10, SW-11) ---
app.use(session({
    secret:            process.env.SESSION_SECRET || 'softwars_secret_dev',
    resave:            false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure:   false,   // cambiar a true en producción con HTTPS
        maxAge:   1000 * 60 * 60 * 8  // 8 horas
    }
}));

// --- Archivos estáticos ---
app.use(express.static('public'));

// --- Rutas API ---
const authRoutes = require('./routes/auth.routes');
const eventosRoutes = require('./routes/eventos.routes');
const actividadesRoutes = require('./routes/actividades.routes');
const oradoresRoutes = require('./routes/oradores.routes');
const standsRoutes = require('./routes/stands.routes');
const participantesRoutes = require('./routes/participantes.routes');
const inscripcionesRoutes = require('./routes/inscripciones.routes');
const postulacionesRoutes = require('./routes/postulaciones.routes');
const usuariosRoutes = require('./routes/usuarios.routes');

app.use('/api/auth', authRoutes);
app.use('/api/eventos', eventosRoutes);
app.use('/api/actividades', actividadesRoutes);
app.use('/api/oradores', oradoresRoutes);
app.use('/api/stands', standsRoutes);
app.use('/api/participantes', participantesRoutes);
app.use('/api/inscripciones', inscripcionesRoutes);
app.use('/api/postulaciones', postulacionesRoutes);
app.use('/api/usuarios', usuariosRoutes);

// --- Manejo centralizado de errores ---
const { manejarError } = require('./middleware/errores');
app.use(manejarError);

// --- Arranque del servidor ---
// TODO (Adonis - SW-5): Conectar a MongoDB antes de levantar el listener
// Por ahora se arranca sin conexión a BD para no bloquear el desarrollo
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

module.exports = app;
