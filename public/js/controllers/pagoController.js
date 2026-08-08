// ==========================================================================
// CONTROLLER: PAGO — js/controllers/pagoController.js
// Simulación visual de pago (no conecta a API real).
// ==========================================================================

const validaciones = window.validaciones;

document.addEventListener('DOMContentLoaded', () => {

    const actividadNombre = document.getElementById('pagoActividadNombre');
    const inputTarjeta    = document.getElementById('pagoNumTarjeta');
    const inputNombre     = document.getElementById('pagoNombre');
    const selectMes       = document.getElementById('pagoMes');
    const selectAnio      = document.getElementById('pagoAnio');
    const inputCVV        = document.getElementById('pagoCVV');
    const btnConfirmar    = document.getElementById('btnConfirmarPago');

    const errTarjeta      = document.getElementById('errorNumTarjeta');
    const errNombre       = document.getElementById('errorNombre');
    const errVencimiento  = document.getElementById('errorVencimiento');
    const errCVV          = document.getElementById('errorCVV');

    // Cargar info desde URL params
    const params = new URLSearchParams(window.location.search);
    const actividadesParam = params.get('actividades');
    const nombreParam      = params.get('nombre');
    const eventoNombre     = params.get('evento');
    const pagoLabel        = document.getElementById('pagoLabel');

    if (actividadesParam && actividadesParam.trim()) {
        if (pagoLabel) pagoLabel.textContent = 'Actividad(es):';
        actividadNombre.textContent = actividadesParam;
    } else if (eventoNombre) {
        if (pagoLabel) pagoLabel.textContent = 'Evento:';
        actividadNombre.textContent = eventoNombre;
    } else {
        if (pagoLabel) pagoLabel.textContent = 'Evento:';
        actividadNombre.textContent = 'Evento no especificado';
    }

    if (nombreParam) {
        inputNombre.value = nombreParam;
    }

    // Filtro: solo dígitos, máx 16, con espacios cada 4
    inputTarjeta.addEventListener('input', () => {
        let solo = inputTarjeta.value.replace(/\D/g, '');
        if (solo.length > 16) solo = solo.slice(0, 16);
        inputTarjeta.value = solo.replace(/(.{4})/g, '$1 ').trim();
    });

    inputTarjeta.addEventListener('keypress', (e) => {
        if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            e.preventDefault();
        }
    });

    inputCVV.addEventListener('keypress', (e) => {
        if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'Tab'].includes(e.key)) {
            e.preventDefault();
        }
    });

    function mostrarError(span, input, mensaje) {
        span.textContent = mensaje;
        if (input) input.classList.add('input-invalido');
    }

    function limpiarError(span, input) {
        span.textContent = '';
        if (input) input.classList.remove('input-invalido');
    }

    function limpiarTodosLosErrores() {
        limpiarError(errTarjeta, inputTarjeta);
        limpiarError(errNombre, inputNombre);
        limpiarError(errVencimiento, null);
        limpiarError(errCVV, inputCVV);
    }

    function validarVencimiento() {
        const mes = parseInt(selectMes.value, 10);
        const anio = parseInt(selectAnio.value, 10);
        const hoy = new Date();
        return !(anio < hoy.getFullYear() || (anio === hoy.getFullYear() && mes < hoy.getMonth() + 1));
    }

    function validarFormulario() {
        limpiarTodosLosErrores();
        let valido = true;

        const digitosTarjeta = inputTarjeta.value.replace(/\s/g, '');
        if (digitosTarjeta.length !== 16) {
            mostrarError(errTarjeta, inputTarjeta, 'El número de tarjeta debe tener exactamente 16 dígitos.');
            valido = false;
        }

        if (!inputNombre.value.trim()) {
            mostrarError(errNombre, inputNombre, 'El nombre del titular es requerido.');
            valido = false;
        }

        if (!validarVencimiento()) {
            mostrarError(errVencimiento, null, 'La tarjeta está vencida. Verificá la fecha de expiración.');
            valido = false;
        }

        const cvv = inputCVV.value.trim();
        if (!/^\d{3,4}$/.test(cvv)) {
            mostrarError(errCVV, inputCVV, 'El código de seguridad debe tener 3 o 4 dígitos.');
            valido = false;
        }

        return valido;
    }

    function limpiarFormulario() {
        inputTarjeta.value = '';
        inputNombre.value = '';
        selectMes.value = '10';
        selectAnio.value = String(new Date().getFullYear());
        inputCVV.value = '';
        limpiarTodosLosErrores();
    }

    btnConfirmar.addEventListener('click', () => {
        if (!validarFormulario()) return;
        validaciones.exito('Pago aprobado', `${actividadNombre.textContent}\nTitular: ${inputNombre.value.trim()}\n\nGracias por tu inscripción.`);
        limpiarFormulario();
    });

    inputTarjeta.addEventListener('input', () => limpiarError(errTarjeta, inputTarjeta));
    inputNombre.addEventListener('input', () => limpiarError(errNombre, inputNombre));
    inputCVV.addEventListener('input', () => limpiarError(errCVV, inputCVV));
    selectMes.addEventListener('change', () => limpiarError(errVencimiento, null));
    selectAnio.addEventListener('change', () => limpiarError(errVencimiento, null));
});
