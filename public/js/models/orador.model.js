// ==========================================================================
// MODEL: ORADOR — js/models/orador.model.js
// Arma el objeto desde los valores del formulario.
// ==========================================================================

export function crearOrador(nombre, correo, telefono, telefono2, especialidad, empresa, biografia, foto, eventoId) {
    return {
        nombre,
        correo,
        telefono,
        telefono2,
        especialidad,
        empresa,
        biografia,
        foto,
        eventoId,
        obtenerDatosParaGuardar() {
            const datos = {
                nombre: this.nombre,
                correo: this.correo,
                telefono: this.telefono,
                especialidad: this.especialidad,
                empresa: this.empresa,
                biografia: this.biografia,
                foto: this.foto,
                eventoId: this.eventoId || null
            };
            if (this.telefono2) datos.telefono2 = this.telefono2;
            return datos;
        }
    };
}
