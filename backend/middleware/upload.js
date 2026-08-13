// ==========================================================================
// MIDDLEWARE DE UPLOAD — backend/middleware/upload.js
// Parsea archivos multipart/form-data y los sube a Cloudinary.
//
// Uso en rutas:
//   const { uploadImagen } = require('../middleware/upload');
//   router.post('/', uploadImagen('eventos'), controller.crear);
//
// El archivo queda en req.file con la URL de Cloudinary en req.file.path.
// Si no se envía archivo, req.file es undefined y la ruta sigue normal.
// ==========================================================================

const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { cloudinary, estaConfigurado } = require('../config/cloudinary');

/**
 * Crea un middleware de upload para una carpeta específica de Cloudinary.
 * @param {string} carpeta - Nombre de la carpeta en Cloudinary (ej: 'eventos', 'oradores', 'stands')
 * @returns {Function} Middleware de multer que acepta un archivo en el campo 'imagen' o 'foto'
 */
function uploadImagen(carpeta) {
    // Si Cloudinary no está configurado, devolver un middleware que no hace nada
    // (el campo de imagen se ignora y el sistema funciona sin fotos)
    if (!estaConfigurado()) {
        return (req, res, next) => next();
    }

    const storage = new CloudinaryStorage({
        cloudinary,
        params: {
            folder: `softwars/${carpeta}`,
            allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
            transformation: [{ width: 800, height: 800, crop: 'limit', quality: 'auto' }]
        }
    });

    const upload = multer({
        storage,
        limits: { fileSize: 5 * 1024 * 1024 } // 5 MB máximo
    });

    // Aceptar campo 'imagen' o 'foto' (según el formulario)
    return (req, res, next) => {
        const middleware = upload.single('imagen');
        middleware(req, res, (err) => {
            if (err) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return res.status(400).json({
                        error: true,
                        mensaje: 'La imagen no puede superar los 5 MB.'
                    });
                }
                if (err.message && err.message.includes('format')) {
                    return res.status(400).json({
                        error: true,
                        mensaje: 'Formato de imagen no permitido. Use JPG, PNG o WebP.'
                    });
                }
                // Si Cloudinary falla, continuar sin imagen en vez de romper la petición
                console.error('[upload] Error subiendo imagen:', err.message || err);
                return next();
            }

            // Si subió archivo, poner la URL en el body para que el controller la use
            if (req.file && req.file.path) {
                req.body.imagen = req.file.path;
            }

            next();
        });
    };
}

/**
 * Middleware para el campo 'foto' (oradores y postulaciones).
 */
function uploadFoto(carpeta) {
    if (!estaConfigurado()) {
        // Sin Cloudinary: aceptar el campo pero validar formato
        const memStorage = multer.memoryStorage();
        const upload = multer({
            storage: memStorage,
            limits: { fileSize: 3 * 1024 * 1024 },
            fileFilter: (req, file, cb) => {
                const tiposPermitidos = ['image/jpeg', 'image/png', 'image/jpg'];
                if (tiposPermitidos.includes(file.mimetype)) {
                    cb(null, true);
                } else {
                    cb(new Error('FORMATO_NO_PERMITIDO'));
                }
            }
        });
        return (req, res, next) => {
            const middleware = upload.single('foto');
            middleware(req, res, (err) => {
                if (err && err.message === 'FORMATO_NO_PERMITIDO') {
                    return res.status(400).json({
                        error: true,
                        mensaje: 'Formato de fotografía no permitido. Solo se aceptan archivos PNG o JPEG.'
                    });
                }
                if (err && err.code === 'LIMIT_FILE_SIZE') {
                    return res.status(400).json({
                        error: true,
                        mensaje: 'La foto no puede superar los 3 MB.'
                    });
                }
                next();
            });
        };
    }

    const storage = new CloudinaryStorage({
        cloudinary,
        params: {
            folder: `softwars/${carpeta}`,
            allowed_formats: ['jpg', 'jpeg', 'png'],
            transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face', quality: 'auto' }]
        }
    });

    const upload = multer({
        storage,
        limits: { fileSize: 3 * 1024 * 1024 } // 3 MB para fotos de perfil
    });

    return (req, res, next) => {
        const middleware = upload.single('foto');
        middleware(req, res, (err) => {
            if (err) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return res.status(400).json({
                        error: true,
                        mensaje: 'La foto no puede superar los 3 MB.'
                    });
                }
                // Si Cloudinary falla, continuar sin foto
                console.error('[upload] Error subiendo foto:', err.message || err);
                return next();
            }

            if (req.file && req.file.path) {
                req.body.foto = req.file.path;
            }

            next();
        });
    };
}

module.exports = { uploadImagen, uploadFoto };
