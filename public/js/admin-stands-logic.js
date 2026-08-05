// ==========================================================================
// PANEL DE STANDS — public/js/admin-stands-logic.js
// Responsable: Josué Arroyo (SW-27)
//
// Migración de la iteración 1 (window.db / localStorage) a la API REST.
// Esta página ya no carga data-store.js (SW-22).
//
// Reglas del ERS que la interfaz refleja:
//   RF-15  El ID numérico lo asigna el servidor y se reinicia cada año
//          (S-2026-001, S-2027-001...). El navegador NUNCA lo calcula: en la
//          iteración 1 se hacía con Math.max(...ids)+1, que repetía números si
//          dos administradores registraban un stand a la vez.
//   RF-16  Edición limitada: el correo y el ID no se pueden modificar. El
//          formulario los bloquea y el servidor responde 400 si igual llegan.
//   RF-22  Búsqueda y filtros (?q=, ?estado=, ?categoria=) se resuelven en
//          MongoDB, no filtrando un arreglo en memoria.
// ==========================================================================

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
    const modalStand      = new bootstrap.Modal(document.getElementById('modalCrearStand'));
    const modalTitulo     = document.getElementById('modalStandTitulo');
    const btnGuardar      = document.getElementById('btnGuardarStand');
    const tbody           = document.getElementById('standsTableBody');
    const searchInput     = document.getElementById('searchStandInput');
    const filterEstado    = document.getElementById('filterEstadoStand');
    const filterCategoria = document.getElementById('filterCategoriaStand');
    const tablaVacia      = document.getElementById('tabla-vacia');

    const inputEvento     = document.getElementById('inputEventoStand');
    const inputNombre     = document.getElementById('inputNombreStand');
    const inputCategoria  = document.getElementById('inputCategoriaStand');
    const inputDesc       = document.getElementById('inputDescStand');
    const inputEncargado  = document.getElementById('inputEncargadoStand');
    const inputEmpresa    = document.getElementById('inputEmpresaStand');
    const inputCorreo     = document.getElementById('inputCorreoStand');
    const inputTelefono   = document.getElementById('inputTelefonoStand');
    const avisoCorreoRf16 = document.getElementById('avisoCorreoRf16');

    // ── Estado de la página ─────────────────────────────────────────────────
    let editandoId = null;   // _id del stand en edición (null = alta)
    let stands     = [];

    // ── Utilidades ──────────────────────────────────────────────────────────

    function escaparHtml(valor) {
        return String(valor ?? '').replace(/[&<>"']/g, c => (
            { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
        ));
    }

    function esValor(valor, referencia) {
        return String(valor || '').toLowerCase() === referencia;
    }

    function idsSeleccionados() {
        return [...tbody.querySelectorAll('.row-check:checked')].map(cb => cb.dataset.id);
    }

    // ── Validación del formulario (primera barrera; el servidor repite) ─────

    function validarFormulario() {
        validaciones.limpiarErrores();
        let valido = true;

        if (!validaciones.validarRequerido(inputEvento.value)) {
            validaciones.mostrarError('inputEventoStand', 'Debe seleccionar el evento al que pertenece el stand.');
            valido = false;
        }

        if (!validaciones.validarRequerido(inputNombre.value)) {
            validaciones.mostrarError('inputNombreStand', 'El nombre del stand es requerido.');
            valido = false;
        } else if (!validaciones.validarNombre(inputNombre.value)) {
            validaciones.mostrarError('inputNombreStand', 'El nombre debe tener al menos 3 caracteres.');
            valido = false;
        }

        if (!validaciones.validarRequerido(inputCategoria.value)) {
            validaciones.mostrarError('inputCategoriaStand', 'Debe seleccionar una categoría.');
            valido = false;
        }

        if (!validaciones.validarRequerido(inputDesc.value)) {
            validaciones.mostrarError('inputDescStand', 'La descripción es requerida.');
            valido = false;
        } else if (!validaciones.validarDescripcion(inputDesc.value, true)) {
            validaciones.mostrarError('inputDescStand', 'La descripción no puede superar los 200 caracteres.');
            valido = false;
        }

        if (!validaciones.validarRequerido(inputEncargado.value)) {
            validaciones.mostrarError('inputEncargadoStand', 'El encargado del stand es requerido.');
            valido = false;
        }

        if (!validaciones.validarRequerido(inputEmpresa.value)) {
            validaciones.mostrarError('inputEmpresaStand', 'La empresa u organización es requerida.');
            valido = false;
        }

        // RF-16: en edición el correo está bloqueado, así que no se valida.
        if (!editandoId) {
            if (!validaciones.validarRequerido(inputCorreo.value)) {
                validaciones.mostrarError('inputCorreoStand', 'El correo de contacto es requerido.');
                valido = false;
            } else if (!validaciones.validarCorreo(inputCorreo.value)) {
                validaciones.mostrarError('inputCorreoStand', 'Ingrese un correo válido (ej. contacto@empresa.com).');
                valido = false;
            }
        }

        if (!validaciones.validarRequerido(inputTelefono.value)) {
            validaciones.mostrarError('inputTelefonoStand', 'El teléfono de contacto es requerido.');
            valido = false;
        } else if (!validaciones.validarTelefono(inputTelefono.value)) {
            validaciones.mostrarError('inputTelefonoStand', 'El teléfono debe tener 8 dígitos (ej. 8888-8888).');
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
        } catch (error) {
            // api.js ya avisó al usuario.
        }
    }

    // ── Tabla ───────────────────────────────────────────────────────────────

    /** RF-22 — los filtros viajan como query params y los resuelve MongoDB. */
    async function cargarStands() {
        try {
            stands = listaDe(await apiGet('stands', {
                q:         searchInput.value.trim(),
                estado:    filterEstado.value,
                categoria: filterCategoria.value
            }), 'stands');
        } catch (error) {
            stands = [];
        }
        renderTabla();
    }

    function renderTabla() {
        tbody.innerHTML = '';
        tablaVacia.classList.toggle('oculto', stands.length > 0);

        stands.forEach(s => {
            const aprobado = esValor(s.estado, 'aprobado');
            // estado-aprobado / estado-cerrado las colorea admin-layout.css.
            const claseEstado = aprobado ? 'estado-aprobado' : 'estado-cerrado';
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><input type="checkbox" class="row-check" data-id="${escaparHtml(s._id)}"></td>
                <td>${escaparHtml(s.codigo)}</td>
                <td>${escaparHtml(s.nombre)}</td>
                <td>${escaparHtml(s.categoria)}</td>
                <td>${escaparHtml(s.encargado)}</td>
                <td>${escaparHtml(s.empresa)}</td>
                <td>${escaparHtml(s.correo)}</td>
                <td>${escaparHtml(s.telefono)}</td>
                <td>
                    <select class="tableSelectStatus ${claseEstado}" data-id="${escaparHtml(s._id)}">
                        <option value="Aprobado" ${aprobado  ? 'selected' : ''}>Aprobado</option>
                        <option value="Cerrado"  ${!aprobado ? 'selected' : ''}>Cerrado</option>
                    </select>
                </td>
            `;
            tbody.appendChild(tr);
        });

        document.getElementById('selectAll').checked = false;

        // RF-15 — el estado se gestiona entre Aprobado y Cerrado.
        tbody.querySelectorAll('.tableSelectStatus').forEach(select => {
            select.addEventListener('change', async (e) => {
                try {
                    await apiPatch(`stands/${e.target.dataset.id}/estado`, { estado: e.target.value });
                    validaciones.exito('Estado actualizado', `El stand se marcó como "${e.target.value}".`);
                } catch (error) { /* api.js ya lo reportó */ }
                cargarStands();
            });
        });
    }

    // ── Alta y edición ──────────────────────────────────────────────────────

    function limpiarModal() {
        [inputEvento, inputNombre, inputCategoria, inputDesc,
         inputEncargado, inputEmpresa, inputCorreo, inputTelefono]
            .forEach(campo => { campo.value = ''; });
        validaciones.limpiarErrores();
    }

    /**
     * RF-16 — el correo y el ID son inmutables. En edición se deshabilita el
     * campo y se explica por qué, en lugar de dejar que el usuario escriba algo
     * que el servidor va a rechazar con un 400.
     */
    function aplicarBloqueoRf16(esEdicion) {
        inputCorreo.disabled = esEdicion;
        inputEvento.disabled = esEdicion;
        avisoCorreoRf16.classList.toggle('oculto', !esEdicion);
    }

    async function guardarStand() {
        if (!validarFormulario()) return;

        const cuerpo = {
            nombre:      inputNombre.value.trim(),
            categoria:   inputCategoria.value,
            descripcion: inputDesc.value.trim(),
            encargado:   inputEncargado.value.trim(),
            empresa:     inputEmpresa.value.trim(),
            telefono:    inputTelefono.value.trim()
        };

        btnGuardar.disabled = true;
        try {
            if (editandoId) {
                // No se envía `correo`: RF-16 lo deja fijo y el servidor
                // devolvería 400 si detecta un intento de cambiarlo.
                await apiPut('stands', editandoId, cuerpo);
                validaciones.exito('Stand actualizado', 'Los datos se guardaron correctamente.');
            } else {
                // El código S-AAAA-NNN lo asigna el servidor (RF-15).
                const creado = await apiPost('stands', {
                    ...cuerpo,
                    correo:   inputCorreo.value.trim(),
                    eventoId: inputEvento.value
                });
                validaciones.exito('Stand registrado', `El stand se registró con el ID ${creado.codigo}.`);
            }
            modalStand.hide();
            cargarStands();
        } catch (error) {
            // 409 (correo repetido en el evento) y 400 los muestra api.js;
            // el modal se queda abierto para poder corregir.
        } finally {
            btnGuardar.disabled = false;
        }
    }

    function abrirModalEditar(id) {
        const stand = stands.find(s => String(s._id) === String(id));
        if (!stand) return;

        editandoId = stand._id;
        modalTitulo.textContent = `Editar Stand ${stand.codigo}`;
        btnGuardar.textContent  = 'Guardar Cambios';

        limpiarModal();
        inputEvento.value    = stand.eventoId || '';
        inputNombre.value    = stand.nombre || '';
        inputCategoria.value = String(stand.categoria || '').toLowerCase();
        inputDesc.value      = stand.descripcion || '';
        inputEncargado.value = stand.encargado || '';
        inputEmpresa.value   = stand.empresa || '';
        inputCorreo.value    = stand.correo || '';
        inputTelefono.value  = stand.telefono || '';

        aplicarBloqueoRf16(true);
        modalStand.show();
    }

    // ── Eventos de la interfaz ──────────────────────────────────────────────

    document.getElementById('btnCrearStand').addEventListener('click', () => {
        editandoId = null;
        modalTitulo.textContent = 'Registrar Stand';
        btnGuardar.textContent  = 'Registrar';
        limpiarModal();
        aplicarBloqueoRf16(false);
        modalStand.show();
    });

    document.getElementById('btnEditarStand').addEventListener('click', () => {
        const seleccionados = idsSeleccionados();
        if (seleccionados.length === 0) {
            validaciones.alerta('Seleccione un stand', 'Debe seleccionar un stand para editar.', 'warning');
            return;
        }
        if (seleccionados.length > 1) {
            validaciones.alerta('Solo uno a la vez', 'Solo puede editar un stand a la vez.', 'warning');
            return;
        }
        abrirModalEditar(seleccionados[0]);
    });

    document.getElementById('btnEliminarStand').addEventListener('click', async () => {
        const seleccionados = idsSeleccionados();
        if (seleccionados.length === 0) {
            validaciones.alerta('Seleccione stands', 'Seleccione al menos un stand para eliminar.', 'warning');
            return;
        }

        const confirmar = await validaciones.confirmar(
            '¿Eliminar stand(s)?',
            `Se eliminarán ${seleccionados.length} stand(s). Esta acción no se puede deshacer.`
        );
        if (!confirmar) return;

        let eliminados = 0;
        for (const id of seleccionados) {
            try {
                await apiDelete('stands', id);
                eliminados++;
            } catch (error) { /* api.js ya lo reportó */ }
        }

        if (eliminados > 0) {
            validaciones.exito('Eliminación completada', `Se eliminaron ${eliminados} stand(s).`);
        }
        cargarStands();
    });

    document.getElementById('selectAll').addEventListener('change', (e) => {
        tbody.querySelectorAll('.row-check').forEach(cb => { cb.checked = e.target.checked; });
    });

    btnGuardar.addEventListener('click', guardarStand);

    // La búsqueda golpea el servidor, así que se espera a que el usuario
    // termine de escribir en vez de disparar una petición por tecla.
    let temporizadorBusqueda = null;
    searchInput.addEventListener('input', () => {
        clearTimeout(temporizadorBusqueda);
        temporizadorBusqueda = setTimeout(cargarStands, 300);
    });
    filterEstado.addEventListener('change', cargarStands);
    filterCategoria.addEventListener('change', cargarStands);

    // ── Carga inicial ───────────────────────────────────────────────────────
    await cargarEventos();
    await cargarStands();
});
