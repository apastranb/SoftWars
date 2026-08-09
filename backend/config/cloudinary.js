// ==========================================================================
// CONFIGURACIÓN DE CLOUDINARY — backend/config/cloudinary.js
// Almacenamiento de imágenes en la nube (eventos, oradores, stands).
// ==========================================================================

const { v2: cloudinary } = require('cloudinary');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Indica si Cloudinary está configurado (las 3 variables están presentes).
 */
function estaConfigurado() {
    return !!(
        process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET
    );
}

module.exports = { cloudinary, estaConfigurado };
