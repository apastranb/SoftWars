// ==========================================================================
// MODEL: STAND — js/models/stand.model.js
// Arma el objeto desde los valores del formulario.
// ==========================================================================

export function crearStand(nombre, categoria, descripcion, encargado, empresa, correo, telefono, eventoId) {
    return {
        nombre,
        categoria,
        descripcion,
        encargado,
        empresa,
        correo,
        telefono,
        eventoId,
        obtenerDatosParaGuardar() {
            return {
                nombre: this.nombre,
                categoria: this.categoria,
                descripcion: this.descripcion,
                encargado: this.encargado,
                empresa: this.empresa,
                correo: this.correo,
                telefono: this.telefono,
                eventoId: this.eventoId
            };
        }
    };
}
