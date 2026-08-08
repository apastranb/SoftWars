// ==========================================================================
// MODEL: USUARIO — js/models/usuario.model.js
// Arma el objeto desde los valores del formulario admin.
// ==========================================================================

export function crearUsuario(nombre, email, password, rol) {
    return {
        nombre,
        email,
        password,
        rol,
        obtenerDatosParaGuardar() {
            return {
                nombre: this.nombre,
                email: this.email,
                password: this.password,
                rol: this.rol
            };
        }
    };
}
