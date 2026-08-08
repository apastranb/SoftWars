// ==========================================================================
// MODEL: POSTULACIÓN — js/models/postulacion.model.js
// Arma el objeto desde los valores del formulario público.
// ==========================================================================

export function crearPostulacion(nombre, correo, telefonos, especialidad, empresa, biografia, foto, actividadId) {
    return {
        nombre,
        correo,
        telefonos,
        especialidad,
        empresa,
        biografia,
        foto,
        actividadId,
        obtenerDatosParaGuardar() {
            return {
                nombre: this.nombre,
                correo: this.correo,
                telefonos: this.telefonos,
                especialidad: this.especialidad,
                empresa: this.empresa,
                biografia: this.biografia,
                foto: this.foto,
                actividadId: this.actividadId
            };
        }
    };
}
