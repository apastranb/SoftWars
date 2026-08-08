// ==========================================================================
// MODEL: PARTICIPANTE — js/models/participante.model.js
// Arma el objeto de inscripción desde los valores del formulario.
// ==========================================================================

export function crearInscripcion(nombreCompleto, idDocumento, correo, telefono, edad, carrera, actividades, eventoId) {
    return {
        nombreCompleto,
        idDocumento,
        correo,
        telefono,
        edad,
        carrera,
        actividades,
        eventoId,
        obtenerDatosParaGuardar() {
            return {
                nombreCompleto: this.nombreCompleto,
                idDocumento: this.idDocumento,
                correo: this.correo,
                telefono: this.telefono,
                edad: parseInt(this.edad, 10),
                carrera: this.carrera,
                actividades: this.actividades,
                eventoId: this.eventoId
            };
        }
    };
}
