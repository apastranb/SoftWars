// --- FUNCIONES DE UTILIDAD PARA ERRORES ---
const mostrarError = (idCampo, mensaje) => {
    validaciones.mostrarError(idCampo, mensaje);
};

const limpiarErrores = (...ids) => {
    validaciones.limpiarErrores(...ids);
};

const mostrarResultado = (id, mensaje, tipo) => {
    validaciones.mostrarResultado(id, mensaje, tipo);
};

document.addEventListener('DOMContentLoaded', () => {
    const formLogin = document.querySelector('#form-login');
    const emailInput = document.querySelector('#email');
    const passwordInput = document.querySelector('#password');

    // RF-32: Validacion en tiempo real por campo (se reutiliza en blur y en submit)
    const validarCampoEmail = () => {
        const email = emailInput.value.trim();
        if (!email) {
            mostrarError('email', 'El correo es obligatorio.');
            return false;
        }
        if (!validaciones.validarCorreo(email)) {
            mostrarError('email', 'Ingrese un correo valido (ej: usuario@dominio.com).');
            return false;
        }
        limpiarErrores('email');
        return true;
    };

    const validarCampoPassword = () => {
        if (!passwordInput.value) {
            mostrarError('password', 'La contrasena es obligatoria.');
            return false;
        }
        limpiarErrores('password');
        return true;
    };

    emailInput.addEventListener('blur', validarCampoEmail);
    passwordInput.addEventListener('blur', validarCampoPassword);

    // ==========================================================
    // HU-01: Iniciar Sesion
    // ==========================================================
    formLogin.addEventListener('submit', (e) => {
        e.preventDefault();
        limpiarErrores('login', 'email', 'password');

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        const emailValido = validarCampoEmail();
        const passwordValido = validarCampoPassword();
        const esValido = emailValido && passwordValido;

        if (!esValido) return;

        // Validacion contra la base de datos compartida (window.db.usuarios)
        const usuario = window.db.usuarios.find(
            u => u.email.toLowerCase() === email.toLowerCase()
        );

        if (!usuario || usuario.password !== password) {
            mostrarError('login', 'Correo o contrasena incorrectos.');
            return;
        }

        if (usuario.estado !== 'Activo') {
            mostrarError('login', 'Esta cuenta se encuentra inactiva. Contacta a un administrador.');
            return;
        }

        // Sesion guardada para que las paginas de administracion puedan
        // reconocer al usuario (data-store.js se reinicia en cada pagina
        // porque el proyecto todavia no tiene backend/persistencia real).
        localStorage.setItem('sesionActiva', 'true');
        localStorage.setItem('sesionEmail', usuario.email);
        localStorage.setItem('sesionNombre', usuario.nombre);
        localStorage.setItem('sesionRol', usuario.rol);

        window.location.href = 'admin-eventos.html';
    });

    // ==========================================================
    // HU-02: Cerrar Sesion (invocado desde el layout de admin)
    // ==========================================================
    window.cerrarSesion = function () {
        localStorage.removeItem('sesionActiva');
        localStorage.removeItem('sesionEmail');
        localStorage.removeItem('sesionNombre');
        localStorage.removeItem('sesionRol');
        window.location.href = 'login.html';
    };

    // ==========================================================
    // HU-04: Modificar Contrasena
    // ==========================================================
    const modalCambiarPass = document.querySelector('#modalCambiarPass');
    const linkForgotPass = document.querySelector('#link-forgot-pass');

    const camposCambiarPass = ['cp-email', 'cp-actual', 'cp-nueva', 'cp-confirmar'];

    const abrirModalCambiarPass = (e) => {
        e.preventDefault();
        camposCambiarPass.forEach(id => { document.querySelector(`#${id}`).value = ''; });
        limpiarErrores(...camposCambiarPass);
        document.querySelector('#resultado-cambiar-pass').className = 'form__result-message';
        document.querySelector('#resultado-cambiar-pass').textContent = '';
        modalCambiarPass.classList.add('active');
    };

    const cerrarModalCambiarPass = () => modalCambiarPass.classList.remove('active');

    linkForgotPass.addEventListener('click', abrirModalCambiarPass);
    document.querySelector('#btnCerrarCambiarPass').addEventListener('click', cerrarModalCambiarPass);
    document.querySelector('#btnCancelarCambiarPass').addEventListener('click', cerrarModalCambiarPass);
    modalCambiarPass.addEventListener('click', (e) => {
        if (e.target === modalCambiarPass) cerrarModalCambiarPass();
    });

    const cpEmailInput = document.querySelector('#cp-email');
    const cpActualInput = document.querySelector('#cp-actual');
    const cpNuevaInput = document.querySelector('#cp-nueva');
    const cpConfirmarInput = document.querySelector('#cp-confirmar');

    const validarCpEmail = () => {
        const email = cpEmailInput.value.trim();
        if (!email) {
            mostrarError('cp-email', 'El correo es obligatorio.');
            return false;
        }
        if (!validaciones.validarCorreo(email)) {
            mostrarError('cp-email', 'Ingresa un correo valido.');
            return false;
        }
        limpiarErrores('cp-email');
        return true;
    };

    const validarCpActual = () => {
        if (!cpActualInput.value) {
            mostrarError('cp-actual', 'Ingresa tu contrasena actual.');
            return false;
        }
        limpiarErrores('cp-actual');
        return true;
    };

    const validarCpNueva = () => {
        if (!cpNuevaInput.value) {
            mostrarError('cp-nueva', 'Ingresa una nueva contrasena.');
            return false;
        }
        if (!validaciones.validarContrasena(cpNuevaInput.value)) {
            mostrarError('cp-nueva', 'La contrasena no cumple con los requisitos de seguridad.');
            return false;
        }
        limpiarErrores('cp-nueva');
        return true;
    };

    const validarCpConfirmar = () => {
        if (cpNuevaInput.value && cpConfirmarInput.value && cpNuevaInput.value !== cpConfirmarInput.value) {
            mostrarError('cp-confirmar', 'Las contrasenas no coinciden.');
            return false;
        }
        limpiarErrores('cp-confirmar');
        return true;
    };

    cpEmailInput.addEventListener('blur', validarCpEmail);
    cpActualInput.addEventListener('blur', validarCpActual);
    cpNuevaInput.addEventListener('blur', validarCpNueva);
    cpConfirmarInput.addEventListener('blur', validarCpConfirmar);

    document.querySelector('#btnCambiarPass').addEventListener('click', () => {
        const email = cpEmailInput.value.trim();
        const actual = cpActualInput.value;
        const nueva = cpNuevaInput.value;

        const esValido = validarCpEmail() && validarCpActual() && validarCpNueva() && validarCpConfirmar();
        if (!esValido) return;

        const usuario = window.db.usuarios.find(
            u => u.email.toLowerCase() === email.toLowerCase()
        );

        if (!usuario) {
            mostrarError('cp-email', 'No existe ninguna cuenta registrada con ese correo.');
            return;
        }

        if (usuario.password !== actual) {
            mostrarError('cp-actual', 'La contrasena actual es incorrecta.');
            return;
        }

        // Actualiza la contrasena en la base de datos simulada
        usuario.password = nueva;

        mostrarResultado('resultado-cambiar-pass', 'Contrasena actualizada correctamente. Ya puedes iniciar sesion.', 'success');
    });
});
