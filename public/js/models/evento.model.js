// ==========================================================================
// MODEL: EVENTO — js/models/evento.model.js
// Arma el objeto desde los valores del formulario.
// ==========================================================================

export function crearEvento(nombre, categoria, descripcion, fechaInicio, fechaFin, horaInicio, horaFin, lugar, cupoMax, responsable, tipoEntrada, visibilidad) {
    return {
        nombre,
        categoria,
        descripcion,
        fechaInicio,
        fechaFin,
        horaInicio,
        horaFin,
        lugar,
        cupoMax,
        responsable,
        tipoEntrada,
        visibilidad,
        obtenerDatosParaGuardar() {
            return {
                nombre: this.nombre,
                categoria: this.categoria,
                descripcion: this.descripcion,
                fechaInicio: this.fechaInicio,
                fechaFin: this.fechaFin,
                horaInicio: this.horaInicio,
                horaFin: this.horaFin,
                lugar: this.lugar,
                cupoMax: this.cupoMax,
                responsable: this.responsable,
                tipoEntrada: this.tipoEntrada,
                visibilidad: this.visibilidad
            };
        }
    };
}
