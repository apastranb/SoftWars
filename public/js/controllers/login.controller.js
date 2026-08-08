// ==========================================================================
// CONTROLLER: LOGIN — js/controllers/login.controller.js
// Entry point ES module para la página de login.
// Importa servicios y contiene la lógica de la vista.
// ==========================================================================

import { login } from '../services/auth.service.js';

// validaciones.js y SweetAlert2 están como scripts globales en el HTML
const { validaciones } = window;

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

    // RF-32: Validación en tiempo real
    const validarCampoEmail = () => {
        const email = emailInput.value.trim();
        if (!email) {
            mostrarError('email', 'El correo es obligatorio.');
            return false;
        }
        if (!validaciones.validarCorreo(email)) {
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

    // HU-01: Iniciar Sesión
    formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();
        limpiarErrores('login', 'email', 'password');

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        const emailValido = validarCampoEmail();
        const passwordValido = validarCampoPassword();
        if (!emailValido || !passwordValido) return;

        const btnEnviar = formLogin.querySelector('button[type="submit"]');
        if (btnEnviar) btnEnviar.disabled = true;

        try {
            const datos = await login(email, password);
            const usuario = (datos && datos.usuario) || {};

            // Puente temporal para páginas que aún usan localStorage
            localStorage.setItem('sesionActiva', 'true');
            localStorage.setItem('sesionEmail', usuario.email || email);
            localStorage.setItem('sesionNombre', usuario.nombre || '');
            localStorage.setItem('sesionRol', usuario.rol || '');

            window.location.href = 'admin-eventos.html';
        } catch (error) {
            const mensaje = (error.datos && error.datos.mensaje) || 'Correo o contraseña incorrectos.';
            mostrarError('login', mensaje);
        } finally {
            if (btnEnviar) btnEnviar.disabled = false;
        }
    });

    // HU-02: Cerrar Sesión (invocado desde el layout de admin)
    window.cerrarSesion = async function () {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
        } catch (error) { /* si falla, igual se sale */ }
        ['sesionActiva', 'sesionEmail', 'sesionNombre', 'sesionRol']
            .forEach(clave => localStorage.removeItem(clave));
        window.location.href = 'login.html';
    };

    // HU-04: Modificar Contraseña
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
        if (!email) { mostrarError('cp-email', 'El correo es obligatorio.'); return false; }
        if (!validaciones.validarCorreo(email)) { mostrarError('cp-email', 'Ingresa un correo válido.'); return false; }
        limpiarErrores('cp-email');
        return true;
    };

    const validarCpActual = () => {
        if (!cpActualInput.value) { mostrarError('cp-actual', 'Ingresa tu contraseña actual.'); return false; }
        limpiarErrores('cp-actual');
        return true;
    };

    const validarCpNueva = () => {
        if (!cpNuevaInput.value) { mostrarError('cp-nueva', 'Ingresa una nueva contraseña.'); return false; }
        if (!validaciones.validarContrasena(cpNuevaInput.value)) { mostrarError('cp-nueva', 'La contraseña no cumple con los requisitos de seguridad.'); return false; }
        limpiarErrores('cp-nueva');
        return true;
    };

    const validarCpConfirmar = () => {
        if (!cpConfirmarInput.value) { mostrarError('cp-confirmar', 'Confirma tu nueva contraseña.'); return false; }
        if (cpNuevaInput.value !== cpConfirmarInput.value) { mostrarError('cp-confirmar', 'Las contraseñas no coinciden.'); return false; }
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

        const esValido = validarCpEmail() & validarCpActual() & validarCpNueva() & validarCpConfirmar();
        if (!esValido) return;

        btnCambiarPass.disabled = true;
        try {
            const respuesta = await fetch('/api/auth/contrasena', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, passwordActual: actual, passwordNueva: nueva })
            });
            const datos = await respuesta.json().catch(() => null);

            if (!respuesta.ok) {
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
