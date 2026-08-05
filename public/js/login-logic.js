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
            mostrarError('password', 'La contraseña es obligatoria.');
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
    // La autenticacion la resuelve el servidor con bcrypt (SW-10) y la sesion
    // viaja en una cookie httpOnly. Ya no se guarda nada en localStorage: las
    // paginas del panel preguntan por la sesion con GET /api/auth/sesion, asi
    // que una bandera en el navegador no serviria para entrar.
    formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();
        limpiarErrores('login', 'email', 'password');

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        const emailValido = validarCampoEmail();
        const passwordValido = validarCampoPassword();
        const esValido = emailValido && passwordValido;

        if (!esValido) return;

        const btnEnviar = formLogin.querySelector('button[type="submit"]');
        if (btnEnviar) btnEnviar.disabled = true;

        try {
            const respuesta = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email, password: password })
            });

            const datos = await respuesta.json().catch(() => null);

            if (!respuesta.ok) {
                // El servidor devuelve el mismo mensaje para correo inexistente
                // y contrasena incorrecta, para no revelar que cuentas existen.
                mostrarError('login', (datos && datos.mensaje) || 'Correo o contraseña incorrectos.');
                return;
            }

            // PUENTE TEMPORAL (SW-22)
            // La sesion real es la cookie del servidor. Pero admin-eventos,
            // admin-actividades, admin-crear-evento, admin-participantes y
            // admin-usuarios todavia se guardan con
            // `localStorage.getItem('sesionActiva')`, asi que sin estas banderas
            // rebotarian al login en un bucle. Se escriben con los datos que
            // devuelve el servidor, NO como credencial: quien decide si hay
            // sesion es siempre /api/auth/sesion.
            // Eliminar estas cuatro lineas cuando esas cinco pantallas migren.
            const usuario = (datos && datos.usuario) || {};
            localStorage.setItem('sesionActiva', 'true');
            localStorage.setItem('sesionEmail', usuario.email || email);
            localStorage.setItem('sesionNombre', usuario.nombre || '');
            localStorage.setItem('sesionRol', usuario.rol || '');

            window.location.href = 'admin-eventos.html';

        } catch (error) {
            mostrarError('login', 'No se pudo contactar el servidor. Verifique que la aplicación esté corriendo.');
        } finally {
            if (btnEnviar) btnEnviar.disabled = false;
        }
    });

    // ==========================================================
    // HU-02: Cerrar Sesion (invocado desde el layout de admin)
    // ==========================================================
    window.cerrarSesion = async function () {
        // Destruye la sesion en el servidor; borrar algo en el navegador
        // no bastaria porque la sesion vive en la cookie.
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
        } catch (error) {
            // Si el servidor no responde, igual se sale de la pantalla.
        }
        // Se limpian tambien las banderas del puente temporal (ver el submit).
        ['sesionActiva', 'sesionEmail', 'sesionNombre', 'sesionRol']
            .forEach(clave => localStorage.removeItem(clave));
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
        modalCambiarPass.classList.add('modal-visible');
    };

    const cerrarModalCambiarPass = () => modalCambiarPass.classList.remove('modal-visible');

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
        if (!cpConfirmarInput.value) {
            mostrarError('cp-confirmar', 'Confirma tu nueva contraseña.');
            return false;
        }
        if (cpNuevaInput.value !== cpConfirmarInput.value) {
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

    const btnCambiarPass = document.querySelector('#btnCambiarPass');

    btnCambiarPass.addEventListener('click', async () => {
        const email = cpEmailInput.value.trim();
        const actual = cpActualInput.value;
        const nueva = cpNuevaInput.value;

        const emailValido     = validarCpEmail();
        const actualValido    = validarCpActual();
        const nuevaValida     = validarCpNueva();
        const confirmarValido = validarCpConfirmar();
        const esValido = emailValido && actualValido && nuevaValida && confirmarValido;
        if (!esValido) return;

        btnCambiarPass.disabled = true;

        try {
            // El servidor vuelve a cifrar con bcrypt; la contrasena en claro
            // solo existe durante esta peticion.
            const respuesta = await fetch('/api/auth/contrasena', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email:          email,
                    passwordActual: actual,
                    passwordNueva:  nueva
                })
            });

            const datos = await respuesta.json().catch(() => null);

            if (!respuesta.ok) {
                // 404 → el correo no existe; 401 → la contrasena actual no
                // coincide; 400 → la nueva no cumple RF-02. Cada uno se muestra
                // junto al campo que lo causo.
                if (respuesta.status === 404) {
                    mostrarError('cp-email', (datos && datos.mensaje) || 'No existe ninguna cuenta registrada con ese correo.');
                } else if (respuesta.status === 401) {
                    mostrarError('cp-actual', (datos && datos.mensaje) || 'La contraseña actual es incorrecta.');
                } else if (datos && Array.isArray(datos.errores)) {
                    mostrarError('cp-nueva', datos.errores.join(' '));
                } else {
                    mostrarResultado('resultado-cambiar-pass', (datos && datos.mensaje) || 'No se pudo actualizar la contraseña.', 'error');
                }
                return;
            }

            mostrarResultado('resultado-cambiar-pass', 'Contraseña actualizada correctamente. Ya puedes iniciar sesión.', 'success');

        } catch (error) {
            mostrarResultado('resultado-cambiar-pass', 'No se pudo contactar el servidor.', 'error');
        } finally {
            btnCambiarPass.disabled = false;
        }
    });
});
