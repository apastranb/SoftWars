// ==========================================================================
// SERVICE: CATEGORÍAS — js/services/categorias.service.js
// Mapea categorías a sus íconos SVG.
// ==========================================================================

const ICONOS_CATEGORIA = {
    'culturales': '../img/categorias/culturales.svg',
    'deportivas': '../img/categorias/deportivas.svg',
    'tecnológicas': '../img/categorias/tecnologicas.svg',
    'tecnologicas': '../img/categorias/tecnologicas.svg',
    'artísticas': '../img/categorias/artisticas.svg',
    'artisticas': '../img/categorias/artisticas.svg',
    'voluntariado': '../img/categorias/voluntariado.svg',
    'recreación': '../img/categorias/recreacion.svg',
    'recreacion': '../img/categorias/recreacion.svg'
};

const PLACEHOLDER = '../img/img-placeholder.png';

/**
 * Devuelve la ruta del SVG para una categoría.
 * Si no se reconoce la categoría, devuelve el placeholder.
 * @param {string} categoria
 * @returns {string} Ruta de la imagen
 */
export function iconoCategoria(categoria) {
    if (!categoria) return PLACEHOLDER;
    return ICONOS_CATEGORIA[categoria.toLowerCase().trim()] || PLACEHOLDER;
}

/**
 * Versión para index.html (sin prefijo ../)
 */
export function iconoCategoriaPublico(categoria) {
    if (!categoria) return 'img/img-placeholder.png';
    const icono = ICONOS_CATEGORIA[categoria.toLowerCase().trim()];
    return icono ? icono.replace('../', '') : 'img/img-placeholder.png';
}
