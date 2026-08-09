// ==========================================================================
// CONTROLLER: PANEL DE PRESENTADORES — js/controllers/adminOradoresController.js
// Responsable: Josué Arroyo (SW-27)
// ==========================================================================

import { apiSesion, apiGet, apiPost, apiPut, apiPatch, apiDelete, listaDe } from '../services/api.service.js';

const validaciones = window.validaciones;
const Swal = window.Swal;

document.addEventListener('DOMContentLoaded', async () => {

    // ── Guardia de sesión ───────────────────────────────────────────────────
    const usuario = await apiSesion();
    if (!usuario) {
        window.location.href = 'login.html';
        return;
    }

    document.getElementById('headerUserName').textContent = usuario.nombre || 'Administrador';
    document.getElementById('headerUserRol').textContent  = usuario.rol    || '';

    document.getElementById('btnLogOut').addEventListener('click', async (e) => {
        e.preventDefault();
        if (!await validaciones.confirmar('¿Cerrar sesión?', 'Se cerrará tu sesión actual.')) return;
        try { await apiPost('auth/logout', {}); } catch (error) { /* la cookie se pierde igual */ }
        window.location.href = 'login.html';
    });

    // ── Referencias al DOM ──────────────────────────────────────────────────
    const modalOrador      = new bootstrap.Modal(document.getElementById('modalCrearOrador'));
    const modalTitulo      = document.getElementById('modalOradorTitulo');
    const btnGuardar       = document.getElementById('btnGuardarOrador');
    const tbody            = document.getElementById('adminOradoresTableBody');
    const searchInput      = document.getElementById('searchInput');
    const filterEstado     = document.getElementById('filterEstado');
    const filterFecha      = document.getElementById('filterFechaOrador');
    const tablaVacia       = document.getElementById('tabla-vacia');

    const inputNombre       = document.getElementById('inputNombreOrador');
    const inputCorreo       = document.getElementById('inputCorreoOrador');
    const inputTelefono     = document.getElementById('inputTelefonoOrador');
    const inputTelefono2    = document.getElementById('inputTelefono2Orador');
    const inputEspecialidad = document.getElementById('inputEspecialidadOrador');
    const inputEmpresa      = document.getElementById('inputEmpresaOrador');
    const inputBiografia    = document.getElementById('inputBiografiaOrador');
    const inputFoto         = document.getElementById('inputFotoOrador');
    const fotoPreview       = document.getElementById('fotoPreview');
    const inputEvento       = document.getElementById('inputEventoOrador');

    const tbodyPostulaciones   = document.getElementById('adminPostulacionesTableBody');
    const tablaVaciaPost       = document.getElementById('tabla-vacia-postulaciones');
    const filterEstadoPost     = document.getElementById('filterEstadoPostulacion');

    // ── Estado de la página ─────────────────────────────────────────────────
    let editandoId   = null;
    let fotoDataUrl  = null;
    let oradores     = [];
    let postulaciones = [];
    let nombresActividad = new Map();

    // ── Utilidades ──────────────────────────────────────────────────────────

    function escaparHtml(valor) {
        return String(valor ?? '').replace(/[&<>"']/g, c => (
            { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
        ));
    }

    function formatearFecha(valor) {
        if (!valor) return '';
        const fecha = new Date(valor);
        if (isNaN(fecha.getTime())) return escaparHtml(valor);
        const d = String(fecha.getDate()).padStart(2, '0');
        const m = String(fecha.getMonth() + 1).padStart(2, '0');
        return `${fecha.getFullYear()}/${m}/${d}`;
    }

    function esEstado(valor, referencia) {
        return String(valor || '').toLowerCase() === referencia;
    }

    function idsSeleccionados(selector) {
        return [...document.querySelectorAll(`${selector}:checked`)].map(cb => cb.dataset.id);
    }

    // ── Validación del formulario ───────────────────────────────────────────

    function validarFormulario() {
        validaciones.limpiarErrores();
        let valido = true;

        if (!validaciones.validarRequerido(inputNombre.value)) {
            validaciones.mostrarError('inputNombreOrador', 'El nombre es requerido.');
            valido = false;
        } else if (!validaciones.validarNombre(inputNombre.value)) {
            validaciones.mostrarError('inputNombreOrador', 'El nombre debe tener al menos 3 caracteres.');
            valido = false;
        }

        if (!validaciones.validarRequerido(inputCorreo.value)) {
            validaciones.mostrarError('inputCorreoOrador', 'El correo es requerido.');
            valido = false;
        } else if (!validaciones.validarCorreo(inputCorreo.value)) {
            validaciones.mostrarError('inputCorreoOrador', 'Ingrese un correo válido (ej. usuario@empresa.com).');
            valido = false;
        }

        if (!validaciones.validarRequerido(inputTelefono.value)) {
            validaciones.mostrarError('inputTelefonoOrador', 'El teléfono principal es requerido.');
            valido = false;
        } else if (!validaciones.validarTelefono(inputTelefono.value)) {
            validaciones.mostrarError('inputTelefonoOrador', 'El teléfono debe tener 8 dígitos (ej. 8888-8888).');
            valido = false;
        }

        if (validaciones.validarRequerido(inputTelefono2.value) &&
            !validaciones.validarTelefono(inputTelefono2.value)) {
            validaciones.mostrarError('inputTelefono2Orador', 'El teléfono secundario debe tener 8 dígitos.');
            valido = false;
        }

        if (!validaciones.validarRequerido(inputEspecialidad.value)) {
            validaciones.mostrarError('inputEspecialidadOrador', 'La especialidad es requerida.');
            valido = false;
        }

        if (!validaciones.validarRequerido(inputEmpresa.value)) {
            validaciones.mostrarError('inputEmpresaOrador', 'La institución u organización es requerida.');
            valido = false;
        }

        if (!validaciones.validarRequerido(inputBiografia.value)) {
            validaciones.mostrarError('inputBiografiaOrador', 'La biografía es requerida.');
            valido = false;
        } else if (!validaciones.validarDescripcion(inputBiografia.value, true)) {
            validaciones.mostrarError('inputBiografiaOrador', 'La biografía no puede superar los 200 caracteres.');
            valido = false;
        }

        return valido;
    }

    // ── Carga de catálogos ──────────────────────────────────────────────────

    async function cargarEventos() {
        try {
            const eventos = listaDe(await apiGet('eventos'), 'eventos');
            inputEvento.innerHTML = '<option value="">Seleccionar evento...</option>';
            eventos.forEach(ev => {
                const opcion = document.createElement('option');
                opcion.value = ev._id;
                opcion.textContent = ev.nombre;
                inputEvento.appendChild(opcion);
            });
        } catch (error) { }
    }

    async function cargarNombresActividad() {
        try {
            const actividades = listaDe(await apiGet('actividades'), 'actividades');
            nombresActividad = new Map(actividades.map(a => [String(a._id), a.nombre]));
        } catch (error) {
            nombresActividad = new Map();
        }
    }

    // ── Tabla de presentadores ──────────────────────────────────────────────

    async function cargarOradores() {
        try {
            oradores = listaDe(await apiGet('oradores', {
                q:             searchInput.value.trim(),
                estado:        filterEstado.value,
                fechaRegistro: filterFecha.value
            }), 'oradores');
        } catch (error) {
            oradores = [];
        }
        renderTabla();
    }

    function renderTabla() {
        tbody.innerHTML = '';
        tablaVacia.classList.toggle('oculto', oradores.length > 0);

        oradores.forEach(o => {
            const activo = esEstado(o.estado, 'activo');
            const tr = document.createElement('tr');

            const avisoBloqueo = o.puedeEliminarse === false
                ? ' <i class="bi bi-lock-fill" title="No se puede eliminar: tiene actividades activas asignadas"></i>'
                : '';

            const claseEstado = activo ? 'estado-activo' : 'estado-inactivo';

            tr.innerHTML = `
                <td><input type="checkbox" class="row-check" data-id="${escaparHtml(o._id)}"></td>
                <td>${formatearFecha(o.fechaRegistro)}</td>
                <td>${escaparHtml(o.nombre)}${avisoBloqueo}</td>
                <td>${escaparHtml(o.correo)}</td>
                <td>${escaparHtml((o.telefonos || []).join(' / ') || o.telefono || '')}</td>
                <td>${escaparHtml(o.especialidad)}</td>
                <td>${escaparHtml(o.empresa)}</td>
                <td>
                    <select class="tableSelectStatus ${claseEstado}" data-id="${escaparHtml(o._id)}">
                        <option value="Activo"   ${activo  ? 'selected' : ''}>Activo</option>
                        <option value="Inactivo" ${!activo ? 'selected' : ''}>Inactivo</option>
                    </select>
                </td>
            `;
            tbody.appendChild(tr);
        });

        document.getElementById('selectAll').checked = false;

        tbody.querySelectorAll('.tableSelectStatus').forEach(select => {
            select.addEventListener('change', async (e) => {
                try {
                    await apiPatch(`oradores/${e.target.dataset.id}/estado`, { estado: e.target.value });
                    validaciones.exito('Estado actualizado', `El presentador se marcó como "${e.target.value}".`);
                } catch (error) { /* api.js ya lo reportó */ }
                cargarOradores();
            });
        });
    }

    // ── Alta y edición ──────────────────────────────────────────────────────

    function limpiarModal() {
        [inputNombre, inputCorreo, inputTelefono, inputTelefono2,
         inputEspecialidad, inputEmpresa, inputBiografia, inputFoto, inputEvento]
            .forEach(campo => { campo.value = ''; });
        fotoPreview.src = '../img/img-placeholder.png';
        fotoDataUrl = null;
        validaciones.limpiarErrores();
    }

    function cuerpoDelFormulario() {
        return {
            nombre:       inputNombre.value.trim(),
            correo:       inputCorreo.value.trim(),
            telefono:     inputTelefono.value.trim(),
            telefono2:    inputTelefono2.value.trim(),
            especialidad: inputEspecialidad.value.trim(),
            empresa:      inputEmpresa.value.trim(),
            biografia:    inputBiografia.value.trim(),
            eventoId:     inputEvento.value || null,
            foto:         fotoDataUrl
        };
    }

    async function guardarOrador() {
        if (!validarFormulario()) return;

        // Construir FormData para soportar upload de foto a Cloudinary
        const formData = new FormData();
        formData.append('nombre', inputNombre.value.trim());
        formData.append('correo', inputCorreo.value.trim());
        formData.append('telefono', inputTelefono.value.trim());
        if (inputTelefono2.value.trim()) formData.append('telefono2', inputTelefono2.value.trim());
        formData.append('especialidad', inputEspecialidad.value.trim());
        formData.append('empresa', inputEmpresa.value.trim());
        formData.append('biografia', inputBiografia.value.trim());
        if (inputEvento.value) formData.append('eventoId', inputEvento.value);

        // Agregar foto como archivo si hay uno seleccionado
        if (inputFoto && inputFoto.files[0]) {
            formData.append('foto', inputFoto.files[0]);
        }

        btnGuardar.disabled = true;
        try {
            const url = editandoId
                ? `/api/oradores/${editandoId}`
                : '/api/oradores';
            const metodo = editandoId ? 'PUT' : 'POST';

            const respuesta = await fetch(url, { method: metodo, body: formData });
            const resultado = await respuesta.json().catch(() => null);

            if (!respuesta.ok) {
                const msg = (resultado && resultado.mensaje) || 'Error al guardar el presentador.';
                validaciones.alerta('Error', msg, 'error');
                return;
            }

            const msgExito = editandoId ? 'Presentador actualizado' : 'Presentador registrado';
            const descExito = editandoId ? 'Los datos se guardaron correctamente.' : 'El presentador se registró con éxito.';
            validaciones.exito(msgExito, descExito);
            modalOrador.hide();
            cargarOradores();
        } catch (error) {
            validaciones.alerta('Error', 'No se pudo contactar el servidor.', 'error');
        } finally {
            btnGuardar.disabled = false;
        }
    }

    async function abrirModalEditar(id) {
        const orador = oradores.find(o => String(o._id) === String(id));
        if (!orador) return;

        editandoId = orador._id;
        modalTitulo.textContent = 'Editar Presentador';
        btnGuardar.textContent  = 'Guardar Cambios';

        limpiarModal();
        inputNombre.value       = orador.nombre || '';
        inputCorreo.value       = orador.correo || '';
        inputTelefono.value     = (orador.telefonos && orador.telefonos[0]) || orador.telefono || '';
        inputTelefono2.value    = (orador.telefonos && orador.telefonos[1]) || '';
        inputEspecialidad.value = orador.especialidad || '';
        inputEmpresa.value      = orador.empresa || '';
        inputBiografia.value    = orador.biografia || '';
        inputEvento.value       = orador.eventoId || '';
        fotoPreview.src         = orador.foto || '../img/img-placeholder.png';
        fotoDataUrl             = orador.foto || null;

        modalOrador.show();
    }

    // ── Bandeja de postulaciones (HU-10) ────────────────────────────────────

    async function cargarPostulaciones() {
        try {
            postulaciones = listaDe(
                await apiGet('postulaciones', { estado: filterEstadoPost.value }),
                'postulaciones'
            );
        } catch (error) {
            postulaciones = [];
        }
        renderPostulaciones();
    }

    function badgeEstadoPostulacion(estado) {
        const clase = esEstado(estado, 'aprobada')  ? 'aprobado'
                    : esEstado(estado, 'rechazada') ? 'inactivo'
                    : 'pendiente';
        return `<span class="status-badge ${clase}">${escaparHtml(estado)}</span>`;
    }

    function renderPostulaciones() {
        tbodyPostulaciones.innerHTML = '';
        tablaVaciaPost.classList.toggle('oculto', postulaciones.length > 0);

        postulaciones.forEach(p => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><input type="checkbox" class="row-check-post" data-id="${escaparHtml(p._id)}"></td>
                <td>${formatearFecha(p.fechaPostulacion)}</td>
                <td>${escaparHtml(p.nombre)}</td>
                <td>${escaparHtml(p.correo)}</td>
                <td>${escaparHtml(p.especialidad)}</td>
                <td>${escaparHtml(nombresActividad.get(String(p.actividadId)) || 'Sin asignar')}</td>
                <td>${badgeEstadoPostulacion(p.estado)}</td>
            `;
            tbodyPostulaciones.appendChild(tr);
        });

        document.getElementById('selectAllPostulaciones').checked = false;
    }

    function pendientesSeleccionadas() {
        const ids = idsSeleccionados('.row-check-post');
        return postulaciones.filter(p => ids.includes(String(p._id)) && esEstado(p.estado, 'pendiente'));
    }

    // ── Eventos de la interfaz ──────────────────────────────────────────────

    document.getElementById('btnCrearOrador').addEventListener('click', () => {
        editandoId = null;
        modalTitulo.textContent = 'Registrar Presentador';
        btnGuardar.textContent  = 'Registrar';
        limpiarModal();
        modalOrador.show();
    });

    document.getElementById('btnEditarOrador').addEventListener('click', () => {
        const seleccionados = idsSeleccionados('.row-check');
        if (seleccionados.length === 0) {
            validaciones.alerta('Seleccione un presentador', 'Debe seleccionar un presentador para editar.', 'warning');
            return;
        }
        if (seleccionados.length > 1) {
            validaciones.alerta('Solo uno a la vez', 'Solo puede editar un presentador a la vez.', 'warning');
            return;
        }
        abrirModalEditar(seleccionados[0]);
    });

    document.getElementById('btnEliminarOrador').addEventListener('click', async () => {
        const seleccionados = idsSeleccionados('.row-check');
        if (seleccionados.length === 0) {
            validaciones.alerta('Seleccione presentadores', 'Seleccione al menos un presentador para eliminar.', 'warning');
            return;
        }

        const confirmar = await validaciones.confirmar(
            '¿Eliminar presentador(es)?',
            `Se eliminarán ${seleccionados.length} presentador(es). Los que tengan actividades activas serán rechazados por el servidor.`
        );
        if (!confirmar) return;

        let eliminados = 0;
        for (const id of seleccionados) {
            try {
                await apiDelete('oradores', id);
                eliminados++;
            } catch (error) { /* api.js ya mostró el motivo del 409 */ }
        }

        if (eliminados > 0) {
            validaciones.exito('Eliminación completada', `Se eliminaron ${eliminados} de ${seleccionados.length} presentador(es).`);
        }
        cargarOradores();
    });

    document.getElementById('selectAll').addEventListener('change', (e) => {
        tbody.querySelectorAll('.row-check').forEach(cb => { cb.checked = e.target.checked; });
    });

    btnGuardar.addEventListener('click', guardarOrador);

    inputFoto.addEventListener('change', () => {
        const archivo = inputFoto.files[0];
        if (!archivo) return;
        const lector = new FileReader();
        lector.onload = (e) => {
            fotoDataUrl = e.target.result;
            fotoPreview.src = fotoDataUrl;
        };
        lector.readAsDataURL(archivo);
    });

    let temporizadorBusqueda = null;
    searchInput.addEventListener('input', () => {
        clearTimeout(temporizadorBusqueda);
        temporizadorBusqueda = setTimeout(cargarOradores, 300);
    });
    filterEstado.addEventListener('change', cargarOradores);
    filterFecha.addEventListener('change', cargarOradores);

    document.getElementById('btnAprobarPostulacion').addEventListener('click', async () => {
        if (idsSeleccionados('.row-check-post').length === 0) {
            validaciones.alerta('Seleccione postulaciones', 'Debe seleccionar al menos una postulación para aprobar.', 'warning');
            return;
        }
        const pendientes = pendientesSeleccionadas();
        if (pendientes.length === 0) {
            validaciones.alerta('Sin pendientes', 'Las postulaciones seleccionadas ya fueron procesadas.', 'info');
            return;
        }

        const confirmar = await validaciones.confirmar(
            '¿Aprobar postulaciones?',
            `Se aprobarán ${pendientes.length} postulación(es) y se registrarán como presentadores.`
        );
        if (!confirmar) return;

        let aprobadas = 0;
        for (const p of pendientes) {
            try {
                await apiPatch(`postulaciones/${p._id}/aprobar`, {});
                aprobadas++;
            } catch (error) { /* api.js ya lo reportó */ }
        }

        if (aprobadas > 0) {
            validaciones.exito('Postulaciones aprobadas', `${aprobadas} presentador(es) registrado(s).`);
        }
        await cargarPostulaciones();
        cargarOradores();
    });

    document.getElementById('btnRechazarPostulacion').addEventListener('click', async () => {
        if (idsSeleccionados('.row-check-post').length === 0) {
            validaciones.alerta('Seleccione postulaciones', 'Debe seleccionar al menos una postulación para rechazar.', 'warning');
            return;
        }
        const pendientes = pendientesSeleccionadas();
        if (pendientes.length === 0) {
            validaciones.alerta('Sin pendientes', 'Solo se pueden rechazar postulaciones pendientes.', 'info');
            return;
        }

        const { value: motivo, isConfirmed } = await Swal.fire({
            title: '¿Rechazar postulación(es)?',
            input: 'textarea',
            inputLabel: 'Motivo del rechazo (opcional, máx. 200 caracteres)',
            inputAttributes: { maxlength: 200 },
            showCancelButton: true,
            confirmButtonText: 'Rechazar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#ef4444'
        });
        if (!isConfirmed) return;

        let rechazadas = 0;
        for (const p of pendientes) {
            try {
                await apiPatch(`postulaciones/${p._id}/rechazar`, { motivo: motivo || '' });
                rechazadas++;
            } catch (error) { /* api.js ya lo reportó */ }
        }

        if (rechazadas > 0) {
            validaciones.exito('Postulaciones rechazadas', `${rechazadas} postulación(es) rechazada(s).`);
        }
        cargarPostulaciones();
    });

    document.getElementById('btnEliminarPostulacion').addEventListener('click', async () => {
        const ids = idsSeleccionados('.row-check-post');
        if (ids.length === 0) {
            validaciones.alerta('Seleccione postulaciones', 'Debe seleccionar al menos una postulación para eliminar.', 'warning');
            return;
        }

        const eliminables = postulaciones.filter(
            p => ids.includes(String(p._id))
        );
        if (eliminables.length === 0) {
            validaciones.alerta('Sin selección', 'No se encontraron postulaciones para eliminar.', 'warning');
            return;
        }

        const confirmar = await validaciones.confirmar(
            '¿Eliminar postulaciones?',
            `Se eliminarán ${eliminables.length} postulación(es). Esta acción no afecta a los presentadores ya registrados.`
        );
        if (!confirmar) return;

        let eliminadas = 0;
        for (const p of eliminables) {
            try {
                await apiDelete('postulaciones', p._id);
                eliminadas++;
            } catch (error) { /* api.js ya lo reportó */ }
        }

        if (eliminadas > 0) {
            validaciones.exito('Eliminadas', `${eliminadas} postulación(es) eliminada(s).`);
        }
        cargarPostulaciones();
    });

    document.getElementById('selectAllPostulaciones').addEventListener('change', (e) => {
        tbodyPostulaciones.querySelectorAll('.row-check-post').forEach(cb => { cb.checked = e.target.checked; });
    });

    filterEstadoPost.addEventListener('change', cargarPostulaciones);

    // ── Carga inicial ───────────────────────────────────────────────────────
    await cargarEventos();
    await cargarNombresActividad();
    await cargarOradores();
    await cargarPostulaciones();
});
