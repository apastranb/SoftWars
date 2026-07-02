// Expresión para validar formato de correo (misma convención usada en el resto del sitio)
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// --- FUNCIONES DE UTILIDAD PARA ERRORES ---
const mostrarError = (idCampo, mensaje) => {
    const spanError = document.getElementById(`error-${idCampo}`);
    if (spanError) {
        spanError.textContent = mensaje;
        spanError.classList.add('form__error-message--active');
    }
};

const limpiarErrores = (...ids) => {
    if (ids.length) {
        ids.forEach(id => {
            const span = document.getElementById(`error-${id}`);
            if (span) {
                span.textContent = '';
                span.classList.remove('form__error-message--active');
            }
        });
        return;
    }
    document.querySelectorAll('.form__error-message').forEach(span => {
        span.classList.remove('form__error-message--active');
        span.textContent = '';
    });
};

const mostrarResultado = (id, mensaje, tipo) => {
    const span = document.getElementById(id);
    if (!span) return;
    span.textContent = mensaje;
    span.className = 'form__result-message form__result-message--' + tipo;
};

document.addEventListener('DOMContentLoaded', () => {
    const formLogin = document.querySelector('#form-login');
    const emailInput = document.querySelector('#email');
    const passwordInput = document.querySelector('#password');

    // RF-32: Validación en tiempo real por campo (se reutiliza en blur y en submit)
    const validarCampoEmail = () => {
        const email = emailInput.value.trim();
        if (!email) {
            mostrarError('email', 'El correo es obligatorio.');
            return false;
        }
        if (!emailRegex.test(email)) {
            mostrarError('email', 'Ingrese un correo válido (ej: usuario@dominio.com).');
            return false;
        }
        limpiarErrores('email');
        return true;
    };

    const validarCampoPassword = () => {
        if (!passwordInput.value) {
            mostrarError('password', 'La contraseña es obligatoria.');
            return false;
        }
        limpiarErrores('password');
        return true;
    };

    emailInput.addEventListener('blur', validarCampoEmail);
    passwordInput.addEventListener('blur', validarCampoPassword);

    // ==========================================================
    // HU-01: Iniciar Sesión
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

        // Validación contra la base de datos compartida (window.db.usuarios)
        const usuario = window.db.usuarios.find(
            u => u.email.toLowerCase() === email.toLowerCase()
        );

        if (!usuario || usuario.password !== password) {
            mostrarError('login', 'Correo o contraseña incorrectos.');
            return;
        }

        if (usuario.estado !== 'Activo') {
            mostrarError('login', 'Esta cuenta se encuentra inactiva. Contacta a un administrador.');
            return;
        }

        // Sesión guardada para que las páginas de administración puedan
        // reconocer al usuario (data-store.js se reinicia en cada página
        // porque el proyecto todavía no tiene backend/persistencia real).
        localStorage.setItem('sesionActiva', 'true');
        localStorage.setItem('sesionEmail', usuario.email);
        localStorage.setItem('sesionNombre', usuario.nombre);
        localStorage.setItem('sesionRol', usuario.rol);

        window.location.href = 'admin-usuarios.html';
    });

    // ==========================================================
    // HU-02: Cerrar Sesión (invocado desde el layout de admin)
    // ==========================================================
    window.cerrarSesion = function () {
        localStorage.removeItem('sesionActiva');
        localStorage.removeItem('sesionEmail');
        localStorage.removeItem('sesionNombre');
        localStorage.removeItem('sesionRol');
        window.location.href = 'login.html';
    };

    // ==========================================================
    // HU-03: Verificar Cuenta
    // ==========================================================
    const modalVerificar = document.querySelector('#modalVerificarCuenta');
    const linkVerify = document.querySelector('#link-verify');

    const abrirModalVerificar = (e) => {
        e.preventDefault();
        document.querySelector('#verify-email').value = '';
        limpiarErrores('verify-email');
        document.querySelector('#resultado-verificar').className = 'form__result-message';
        document.querySelector('#resultado-verificar').textContent = '';
        modalVerificar.classList.add('active');
    };

    const cerrarModalVerificar = () => modalVerificar.classList.remove('active');

    linkVerify.addEventListener('click', abrirModalVerificar);
    document.querySelector('#btnCerrarVerificar').addEventListener('click', cerrarModalVerificar);
    document.querySelector('#btnCancelarVerificar').addEventListener('click', cerrarModalVerificar);
    modalVerificar.addEventListener('click', (e) => {
        if (e.target === modalVerificar) cerrarModalVerificar();
    });

    const verifyEmailInput = document.querySelector('#verify-email');
    const validarVerifyEmail = () => {
        const email = verifyEmailInput.value.trim();
        if (!email) {
            mostrarError('verify-email', 'Ingresa un correo para verificar.');
            return false;
        }
        if (!emailRegex.test(email)) {
            mostrarError('verify-email', 'Ingresa un correo válido.');
            return false;
        }
        limpiarErrores('verify-email');
        return true;
    };
    verifyEmailInput.addEventListener('blur', validarVerifyEmail);

    document.querySelector('#btnVerificar').addEventListener('click', () => {
        if (!validarVerifyEmail()) return;
        const email = verifyEmailInput.value.trim();

        const usuario = window.db.usuarios.find(
            u => u.email.toLowerCase() === email.toLowerCase()
        );

        if (!usuario) {
            mostrarResultado('resultado-verificar', 'No existe ninguna cuenta registrada con ese correo.', 'error');
            return;
        }

        if (usuario.estado === 'Activo') {
            mostrarResultado('resultado-verificar', `La cuenta de ${usuario.nombre} está activa y lista para usarse.`, 'success');
        } else {
            mostrarResultado('resultado-verificar', `La cuenta de ${usuario.nombre} existe pero está inactiva. Contacta a un administrador.`, 'error');
        }
    });

    // ==========================================================
    // HU-04: Modificar Contraseña
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
        if (!emailRegex.test(email)) {
            mostrarError('cp-email', 'Ingresa un correo válido.');
            return false;
        }
        limpiarErrores('cp-email');
        return true;
    };

    const validarCpActual = () => {
        if (!cpActualInput.value) {
            mostrarError('cp-actual', 'Ingresa tu contraseña actual.');
            return false;
        }
        limpiarErrores('cp-actual');
        return true;
    };

    const validarCpNueva = () => {
        if (!cpNuevaInput.value) {
            mostrarError('cp-nueva', 'Ingresa una nueva contraseña.');
            return false;
        }
        if (!validaciones.validarContrasena(cpNuevaInput.value)) {
            mostrarError('cp-nueva', 'La contraseña no cumple con los requisitos de seguridad.');
            return false;
        }
        limpiarErrores('cp-nueva');
        return true;
    };

    const validarCpConfirmar = () => {
        if (cpNuevaInput.value && cpConfirmarInput.value && cpNuevaInput.value !== cpConfirmarInput.value) {
            mostrarError('cp-confirmar', 'Las contraseñas no coinciden.');
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
            mostrarError('cp-actual', 'La contraseña actual es incorrecta.');
            return;
        }

        // Actualiza la contraseña en la base de datos simulada
        usuario.password = nueva;

        mostrarResultado('resultado-cambiar-pass', 'Contraseña actualizada correctamente. Ya puedes iniciar sesión.', 'success');
    });
});
