// ==========================================================================
// MÓDULO: CREAR / EDITAR EVENTO — admin-crear-evento-logic.js
// Consume POST /api/eventos, PUT /api/eventos/:id, GET /api/eventos/:id
// ==========================================================================

const mostrarError = (idCampo, mensaje) => { validaciones.mostrarError(idCampo, mensaje); };
const limpiarErrores = () => { validaciones.limpiarErrores(); };

let eventoEditandoId = null; // ID de MongoDB si estamos editando

// ── DRAG & DROP / PREVIEW ───────────────────────────────────────────────

const inicializarDragAndDrop = () => {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('portadaEvento');
    if (!uploadArea || !fileInput) return;

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(ev => {
        uploadArea.addEventListener(ev, (e) => { e.preventDefault(); e.stopPropagation(); }, false);
    });
    ['dragenter', 'dragover'].forEach(ev => {
        uploadArea.addEventListener(ev, () => uploadArea.classList.add('dragover'), false);
    });
    ['dragleave', 'drop'].forEach(ev => {
        uploadArea.addEventListener(ev, () => uploadArea.classList.remove('dragover'), false);
    });

    uploadArea.addEventListener('drop', (e) => {
        const files = e.dataTransfer.files;
        if (files.length) { fileInput.files = files; procesarArchivo(files[0]); }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) procesarArchivo(e.target.files[0]);
    });

    function procesarArchivo(file) {
        const formatosValidos = ['image/jpeg', 'image/png'];
        if (!formatosValidos.includes(file.type)) {
            validaciones.alerta('Formato inválido', 'Por favor, selecciona un archivo PNG o JPG.', 'error');
            fileInput.value = '';
            return;
        }
        const icon = uploadArea.querySelector('i');
        const text = uploadArea.querySelector('p');
        if (icon) { icon.className = "bi bi-check-circle-fill"; icon.style.color = "var(--success)"; }
        if (text) text.textContent = file.name;
    }
};

const inicializarPreviewImagen = () => {
    const portadaEvento = document.getElementById('portadaEvento');
    const previewPortada = document.getElementById('previewPortada');
    if (!portadaEvento || !previewPortada) return;

    portadaEvento.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => { previewPortada.src = ev.target.result; previewPortada.style.display = 'block'; };
            reader.readAsDataURL(file);
        }
    });
};

// ── ASISTENTE IA (SW-25) ────────────────────────────────────────────────

const inicializarAsistenteIA = () => {
    const btnMejorarDesc = document.getElementById('btnMejorarDesc');
    const descEvento = document.getElementById('descEvento');
    if (!btnMejorarDesc || !descEvento) return;

    const textoBoton = btnMejorarDesc.innerHTML;

    btnMejorarDesc.addEventListener('click', async () => {
        if (descEvento.value.trim() === '') {
            mostrarError('descEvento', 'Escribe algo primero para que la IA lo mejore.');
            return;
        }

        btnMejorarDesc.disabled = true;
        btnMejorarDesc.innerHTML = '<i class="bi bi-hourglass-split"></i> Mejorando...';

        try {
            const respuesta = await fetch('/api/asistente/descripcion', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    texto: descEvento.value.trim(),
                    nombre: (document.getElementById('nombreEvento') || {}).value || '',
                    categoria: (document.getElementById('categoriaEvento') || {}).value || ''
                })
            });

            const datos = await respuesta.json().catch(() => null);

            if (!respuesta.ok) {
                const mensaje = (datos && datos.mensaje) || 'El asistente de IA no está disponible.';
                validaciones.alerta('Asistente de IA', mensaje, 'warning');
                return;
            }

            const anterior = descEvento.value;
            descEvento.value = datos.descripcion;

            const resultado = await Swal.fire({
                title: 'Descripción mejorada',
                text: datos.descripcion,
                icon: 'success',
                showCancelButton: true,
                confirmButtonText: 'Conservar',
                cancelButtonText: 'Deshacer',
                confirmButtonColor: '#164a98'
            });

            if (!resultado.isConfirmed) descEvento.value = anterior;
        } catch (error) {
            mostrarError('descEvento', 'No se pudo contactar el asistente de IA.');
        } finally {
            btnMejorarDesc.disabled = false;
            btnMejorarDesc.innerHTML = textoBoton;
        }
    });
};

const inicializarFechasInteligentes = () => {
    const fechaInicio = document.getElementById('fechaInicioEvento');
    const fechaFin = document.getElementById('fechaFinEvento');
    if (!fechaInicio || !fechaFin) return;
    fechaInicio.addEventListener('change', () => {
        if (fechaFin.value === '') fechaFin.value = fechaInicio.value;
    });
};

// ── MODO EDICIÓN ────────────────────────────────────────────────────────

const cargarDatosEdicion = async () => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('editar');
    if (!id) return;

    try {
        const respuesta = await apiGet(`eventos/${id}`);
        const evento = respuesta.data || respuesta;
        if (!evento || !evento.nombre) return;

        eventoEditandoId = id;

        const titulo = document.querySelector('.headerTitle h1');
        if (titulo) titulo.textContent = 'Editar Evento';
        const breadcrumbActual = document.querySelector('.page-breadcrumb-item[aria-current="page"]');
        if (breadcrumbActual) breadcrumbActual.textContent = 'Editar Evento';

        document.getElementById('nombreEvento').value = evento.nombre || '';
        document.getElementById('categoriaEvento').value = evento.categoria || '';
        document.getElementById('cupoEvento').value = evento.cupoMax || '';
        document.getElementById('descEvento').value = evento.descripcion || '';
        document.getElementById('fechaInicioEvento').value = evento.fechaInicio || '';
        document.getElementById('fechaFinEvento').value = evento.fechaFin || '';
        document.getElementById('lugarEvento').value = evento.lugar || '';
        document.getElementById('horaInicio').value = evento.horaInicio || '';
        document.getElementById('horaFin').value = evento.horaFin || '';
        document.getElementById('responsableEvento').value = evento.responsable || '';

        if (evento.tipoEntrada) {
            const radio = document.querySelector(`input[name="tipoEntrada"][value="${evento.tipoEntrada}"]`);
            if (radio) radio.checked = true;
        }
        if (evento.visibilidad) {
            const radio = document.querySelector(`input[name="visibilidad"][value="${evento.visibilidad}"]`);
            if (radio) radio.checked = true;
        }

        const btnPublicar = document.getElementById('publicarEvento');
        if (btnPublicar) btnPublicar.textContent = 'Guardar Cambios';

    } catch (error) {
        console.error('Error cargando evento para edición:', error);
    }
};

// ── VALIDACIÓN Y ENVÍO ──────────────────────────────────────────────────

const validarFormularioEvento = async (e) => {
    e.preventDefault();
    limpiarErrores();
    let esValido = true;

    const camposRequeridos = [
        { id: 'nombreEvento', mensaje: 'El nombre del evento es obligatorio.' },
        { id: 'categoriaEvento', mensaje: 'Debe seleccionar una categoría.' },
        { id: 'descEvento', mensaje: 'La descripción es obligatoria.' },
        { id: 'fechaInicioEvento', mensaje: 'Debe seleccionar una fecha de inicio.' },
        { id: 'fechaFinEvento', mensaje: 'Debe seleccionar una fecha de finalización.' },
        { id: 'lugarEvento', mensaje: 'El lugar es obligatorio.' },
        { id: 'horaInicio', mensaje: 'Establezca una hora de inicio.' },
        { id: 'horaFin', mensaje: 'Establezca una hora de finalización.' },
        { id: 'responsableEvento', mensaje: 'El nombre del responsable es obligatorio.' }
    ];

    camposRequeridos.forEach(campo => {
        if (!validaciones.validarCampo(campo.id, validaciones.validarRequerido, campo.mensaje)) {
            esValido = false;
        }
    });

    const nombreVal = document.getElementById('nombreEvento').value;
    if (nombreVal.trim() !== '' && !validaciones.validarNombre(nombreVal)) {
        mostrarError('nombreEvento', 'El nombre debe tener al menos 3 caracteres.');
        esValido = false;
    }

    const descVal = document.getElementById('descEvento').value;
    if (descVal.trim() !== '' && !validaciones.validarDescripcion(descVal, false)) {
        mostrarError('descEvento', 'La descripción no puede superar los 200 caracteres.');
        esValido = false;
    }

    const tipoEntrada = document.querySelector('input[name="tipoEntrada"]:checked');
    if (!tipoEntrada) {
        mostrarError('tipoEntrada', 'Debe seleccionar el tipo de entrada.');
        esValido = false;
    }

    const visibilidad = document.querySelector('input[name="visibilidad"]:checked');
    if (!visibilidad) {
        mostrarError('visibilidad', 'Debe seleccionar la visibilidad del evento.');
        esValido = false;
    }

    const cupoEvento = document.getElementById('cupoEvento');
    if (cupoEvento && validaciones.validarRequerido(cupoEvento.value)) {
        if (!validaciones.validarCupo(cupoEvento.value)) {
            mostrarError('cupoEvento', 'El cupo debe ser al menos de 1 persona.');
            esValido = false;
        }
    } else if (cupoEvento && !validaciones.validarRequerido(cupoEvento.value)) {
        mostrarError('cupoEvento', 'El cupo es obligatorio.');
        esValido = false;
    }

    const horaInicio = document.getElementById('horaInicio').value;
    const horaFin = document.getElementById('horaFin').value;
    if (horaInicio && horaFin && !validaciones.validarHorasOrden(horaInicio, horaFin)) {
        mostrarError('horaFin', 'La hora de finalización debe ser posterior a la de inicio.');
        esValido = false;
    }

    const fechaInicio = document.getElementById('fechaInicioEvento').value;
    const fechaFin = document.getElementById('fechaFinEvento').value;
    if (fechaInicio && fechaFin && !validaciones.validarFechasOrden(fechaInicio, fechaFin)) {
        mostrarError('fechaFinEvento', 'La fecha final no puede ser anterior a la de inicio.');
        esValido = false;
    }

    if (!esValido) return;

    // Construir datos del evento
    const datos = {
        nombre: document.getElementById('nombreEvento').value.trim(),
        categoria: document.getElementById('categoriaEvento').value,
        cupoMax: parseInt(document.getElementById('cupoEvento').value),
        descripcion: document.getElementById('descEvento').value.trim(),
        fechaInicio: document.getElementById('fechaInicioEvento').value,
        fechaFin: document.getElementById('fechaFinEvento').value,
        lugar: document.getElementById('lugarEvento').value.trim(),
        horaInicio: document.getElementById('horaInicio').value,
        horaFin: document.getElementById('horaFin').value,
        responsable: document.getElementById('responsableEvento').value.trim(),
        tipoEntrada: tipoEntrada.value,
        visibilidad: visibilidad.value
    };

    try {
        if (eventoEditandoId) {
            await apiPut('eventos', eventoEditandoId, datos);
            validaciones.exito('Evento actualizado', 'Los cambios se guardaron correctamente.').then(() => {
                window.location.href = 'admin-eventos.html';
            });
        } else {
            await apiPost('eventos', datos);
            validaciones.exito('Evento creado', 'El evento se registró con éxito.').then(() => {
                window.location.href = 'admin-eventos.html';
            });
        }
    } catch (error) {
        // apiPost/apiPut ya muestra el error
    }
};

// ── INICIALIZADOR ───────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
    // Verificar sesión
    const usuario = await apiSesion();
    if (!usuario) {
        window.location.href = 'login.html';
        return;
    }

    // Cerrar sesión
    document.getElementById('btnLogOut').addEventListener('click', async (e) => {
        e.preventDefault();
        const confirmar = await validaciones.confirmar('¿Cerrar sesión?', 'Se cerrará tu sesión actual.');
        if (!confirmar) return;
        try { await fetch('/api/auth/logout', { method: 'POST' }); } catch (err) {}
        localStorage.clear();
        window.location.href = 'login.html';
    });

    inicializarDragAndDrop();
    inicializarPreviewImagen();
    inicializarAsistenteIA();
    inicializarFechasInteligentes();
    await cargarDatosEdicion();

    const form = document.getElementById('formCrearEvento');
    if (form) form.addEventListener('submit', validarFormularioEvento);

    const btnCancelar = document.getElementById('newEventCancel');
    if (btnCancelar) {
        btnCancelar.addEventListener('click', () => { window.location.href = 'admin-eventos.html'; });
    }
});
