document.addEventListener('DOMContentLoaded', () => {

    // ── Referencias al DOM ──────────────────────────────────────────────────
    const actividadNombre = document.getElementById('pagoActividadNombre');
    const inputTarjeta    = document.getElementById('pagoNumTarjeta');
    const inputNombre     = document.getElementById('pagoNombre');
    const selectMes       = document.getElementById('pagoMes');
    const selectAnio      = document.getElementById('pagoAnio');
    const inputCVV        = document.getElementById('pagoCVV');
    const btnConfirmar    = document.getElementById('btnConfirmarPago');

    // Spans de error
    const errTarjeta      = document.getElementById('errorNumTarjeta');
    const errNombre       = document.getElementById('errorNombre');
    const errVencimiento  = document.getElementById('errorVencimiento');
    const errCVV          = document.getElementById('errorCVV');

    // ── Cargar info de actividad desde URL params ────────────────────────────
    const params = new URLSearchParams(window.location.search);
    const actividadId = params.get('actividad');
    let nombreActividad = 'Actividad no especificada';

    if (actividadId && window.db && window.db.actividades) {
        const actividad = window.db.actividades.find(a => a.id === actividadId);
        if (actividad) {
            nombreActividad = actividad.nombre;
        }
    }
    actividadNombre.textContent = nombreActividad;

    // ── Filtro en tiempo real: solo dígitos, máx 16, con espacios cada 4 ───
    inputTarjeta.addEventListener('input', () => {
        // Elimina todo lo que no sea dígito
        let solo = inputTarjeta.value.replace(/\D/g, '');
        // Limita a 16 dígitos
        if (solo.length > 16) solo = solo.slice(0, 16);
        // Formatea con espacios cada 4 dígitos: 1234 5678 9012 3456
        inputTarjeta.value = solo.replace(/(.{4})/g, '$1 ').trim();
    });

    inputTarjeta.addEventListener('keypress', (e) => {
        // Bloquea cualquier tecla que no sea dígito
        if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            e.preventDefault();
        }
    });

    // ── Solo dígitos en CVV ─────────────────────────────────────────────────
    inputCVV.addEventListener('keypress', (e) => {
        if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'Tab'].includes(e.key)) {
            e.preventDefault();
        }
    });

    // ── Utilidades de validación ────────────────────────────────────────────
    function mostrarError(span, input, mensaje) {
        span.textContent = mensaje;
        if (input) input.classList.add('input-invalido');
    }

    function limpiarError(span, input) {
        span.textContent = '';
        if (input) input.classList.remove('input-invalido');
    }

    function limpiarTodosLosErrores() {
        limpiarError(errTarjeta,     inputTarjeta);
        limpiarError(errNombre,      inputNombre);
        limpiarError(errVencimiento, null);
        limpiarError(errCVV,         inputCVV);
    }

    function validarVencimiento() {
        const mes  = parseInt(selectMes.value, 10);
        const anio = parseInt(selectAnio.value, 10);
        const hoy  = new Date();
        const anioActual = hoy.getFullYear();
        const mesActual  = hoy.getMonth() + 1;

        if (anio < anioActual || (anio === anioActual && mes < mesActual)) {
            return false;
        }
        return true;
    }

    // ── Validación completa al confirmar ────────────────────────────────────
    function validarFormulario() {
        limpiarTodosLosErrores();
        let valido = true;

        // Número de tarjeta: 16 dígitos sin espacios
        const digitosTarjeta = inputTarjeta.value.replace(/\s/g, '');
        if (digitosTarjeta.length !== 16) {
            mostrarError(errTarjeta, inputTarjeta, 'El número de tarjeta debe tener exactamente 16 dígitos.');
            valido = false;
        }

        // Nombre
        if (!inputNombre.value.trim()) {
            mostrarError(errNombre, inputNombre, 'El nombre del titular es requerido.');
            valido = false;
        }

        // Vencimiento
        if (!validarVencimiento()) {
            mostrarError(errVencimiento, null, 'La tarjeta está vencida. Verificá la fecha de expiración.');
            valido = false;
        }

        // CVV: 3 o 4 dígitos
        const cvv = inputCVV.value.trim();
        if (!/^\d{3,4}$/.test(cvv)) {
            mostrarError(errCVV, inputCVV, 'El código de seguridad debe tener 3 o 4 dígitos.');
            valido = false;
        }

        return valido;
    }

    // ── Limpiar formulario ──────────────────────────────────────────────────
    function limpiarFormulario() {
        inputTarjeta.value    = '';
        inputNombre.value     = '';
        selectMes.value       = '10';
        selectAnio.value      = String(new Date().getFullYear());
        inputCVV.value        = '';
        limpiarTodosLosErrores();
    }

    // ── Confirmar pago ──────────────────────────────────────────────────────
    btnConfirmar.addEventListener('click', () => {
        if (!validarFormulario()) return;

        validaciones.exito('Pago aprobado', `Actividad: ${nombreActividad}\nTitular: ${inputNombre.value.trim()}\n\nGracias por tu inscripción.`);
        limpiarFormulario();
    });

    // ── Limpiar errores en tiempo real al corregir ──────────────────────────
    inputTarjeta.addEventListener('input', () => limpiarError(errTarjeta, inputTarjeta));
    inputNombre.addEventListener('input',  () => limpiarError(errNombre,  inputNombre));
    inputCVV.addEventListener('input',     () => limpiarError(errCVV,     inputCVV));
    selectMes.addEventListener('change',   () => limpiarError(errVencimiento, null));
    selectAnio.addEventListener('change',  () => limpiarError(errVencimiento, null));
});
