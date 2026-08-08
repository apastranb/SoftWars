// ==========================================================================
// MODEL: ACTIVIDAD — js/models/actividad.model.js
// Arma el objeto desde los valores del formulario.
// ==========================================================================

export function crearActividad(eventoId, nombre, categoria, descripcion, fecha, horaInicio, horaFin, lugar, cupoMaximo, responsableId, visibilidad, entradaLibre, incluyeRefrigerio) {
    return {
        eventoId,
        nombre,
        categoria,
        descripcion,
        fecha,
        horaInicio,
        horaFin,
        lugar,
        cupoMaximo,
        responsableId,
        visibilidad,
        entradaLibre,
        incluyeRefrigerio,
        obtenerDatosParaGuardar() {
            return {
                eventoId: this.eventoId,
                nombre: this.nombre,
                categoria: this.categoria,
                descripcion: this.descripcion,
                fecha: this.fecha,
                horaInicio: this.horaInicio,
                horaFin: this.horaFin,
                lugar: this.lugar,
                cupoMaximo: this.entradaLibre ? 0 : this.cupoMaximo,
                responsableId: this.responsableId,
                visibilidad: this.visibilidad,
                entradaLibre: this.entradaLibre,
                incluyeRefrigerio: this.incluyeRefrigerio
            };
        }
    };
}
