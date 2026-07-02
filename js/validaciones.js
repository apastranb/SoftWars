// Validaciones globales del sistema
const validaciones = {
    // Validación estricta: RF-02 (Sin vocales, 8-16 chars, 1 num, 1 especial, 1 mayús, 1 minús)
    validarContrasena: function(password) {
        const tieneLongitud = password.length >= 8 && password.length <= 16;
        const tieneNumero = /[0-9]/.test(password);
        const tieneEspecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
        const tieneMayuscula = /[A-Z]/.test(password);
        const tieneMinuscula = /[a-z]/.test(password);
        const ceroVocales = /^[^aeiouAEIOUáéíóúÁÉÍÓÚ]+$/.test(password);

        return tieneLongitud && tieneNumero && tieneEspecial && tieneMayuscula && tieneMinuscula && ceroVocales;
    },

    // RF-23: Teléfono costarricense (8 dígitos, con o sin guión, ej. 8888-8888)
    validarTelefono: function(telefono) {
        const limpio = telefono.replace(/-/g, '');
        return /^[0-9]{8}$/.test(limpio);
    },

    // RF-23: Cédula/ID (solo dígitos y guiones, entre 8 y 12 dígitos, ej. 1-1111-1111)
    validarCedula: function(idDocumento) {
        const limpio = idDocumento.replace(/-/g, '');
        return /^[0-9]{8,12}$/.test(limpio);
    }
};

