// ==========================================================================
// LÓGICA DE PARTICIPANTES — public/js/admin-participantes-logic.js
// Responsable: Kenner Gamboa (SW-30)
//
// Consume la API REST en lugar de window.db.
// Endpoints usados:
//   GET    /api/participantes        — listar con filtros
//   GET    /api/inscripciones        — vista global de inscripciones
//   PUT    /api/participantes/:id    — editar participante
//   DELETE /api/participantes/:id    — eliminar (baja lógica)
// ==========================================================================

// ── Cierre de sesión ────────────────────────────────────────────────────
window.cerrarSesion = function () {
    fetch('/api/auth/logout', { method: 'POST' })
        .finally(() => { window.location.href = 'login.html'; });
};

// ── Helpers HTTP ────────────────────────────────────────────────────────

async function apiGet(ruta) {
    const res = await fetch(ruta);
    if (!res.ok) throw await res.json();
    return res.json();
}

async function apiPut(ruta, datos) {
    const res = await fetch(ruta, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(datos)
    });
    if (!res.ok) throw await res.json();
    return res.json();
}

async function apiDelete(ruta) {
    const res = await fetch(ruta, { method: 'DELETE' });
    if (!res.ok) throw await res.json();
    return res.json();
}

// ── Renderizado de la tabla ─────────────────────────────────────────────

async function renderizarTablaParticipantes() {
    const tbody      = document.getElementById('tbody-participantes');
    const tablaVacia = document.getElementById('tabla-vacia');

    const textoBusqueda = document.getElementById('searchInput').value.trim().toLowerCase();
    const filtroEstado  = document.getElementById('filtro-estado').value;
    const filtroFecha   = document.getElementById('filtro-fecha').value;

    // Construir query string para el filtro
    const params = new URLSearchParams();
    if (filtroEstado) params.append('estado', filtroEstado);
    if (filtroFecha)  params.append('fecha',  filtroFecha);

    try {
        const data = await apiGet(`/api/inscripciones?${params.toString()}`);
        let participantes = data.inscripciones || [];

        // Filtro de búsqueda local (texto libre)
        if (textoBusqueda) {
            participantes = participantes.filter(p =>
                p.nombreCompleto?.toLowerCase().includes(textoBusqueda) ||
                p.correo?.toLowerCase().includes(textoBusqueda) ||
                p.idDocumento?.includes(textoBusqueda) ||
                p.carrera?.toLowerCase().includes(textoBusqueda)
            );
        }

        tbody.innerHTML = '';

        if (participantes.length === 0) {
            tablaVacia.classList.remove('oculto');
            return;
        }
        tablaVacia.classList.add('oculto');

        participantes.forEach(p => {
            const actividades = (p.actividadesNombres || []).join(', ') || '—';
            const fecha = p.fechaInscripcion
                ? new Date(p.fechaInscripcion).toLocaleDateString('es-CR')
                : '—';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><input type="checkbox" class="row-check" data-id="${p._id}"></td>
                <td>${p.codigo || p._id}</td>
                <td>${p.nombreCompleto}</td>
                <td>${p.idDocumento}</td>
                <td>${p.correo}</td>
                <td>${p.telefono}</td>
                <td>${p.edad}</td>
                <td>${p.carrera || '—'}</td>
                <td>${actividades}</td>
                <td>
                    <select class="tableSelectStatus ${p.estado === 'Activo' ? 'estado-activo' : 'estado-inactivo'}" data-id="${p._id}">
                        <option value="Activo" ${p.estado === 'Activo' ? 'selected' : ''}>Activo</option>
                        <option value="Cancelado" ${p.estado === 'Cancelado' ? 'selected' : ''}>Cancelado</option>
                    </select>
                </td>
                <td>${fecha}</td>
            `;
            tbody.appendChild(tr);
        });

        document.getElementById('selectAll').checked = false;

        // Cambio de estado directo (consistente con admin-eventos, admin-actividades)
        tbody.querySelectorAll('.tableSelectStatus').forEach(select => {
            select.addEventListener('change', async (e) => {
                const id = e.target.dataset.id;
                const nuevoEstado = e.target.value;
                try {
                    await apiPut(`/api/participantes/${id}`, { estado: nuevoEstado });
                    // Actualizar clase de color
                    e.target.classList.remove('estado-activo', 'estado-inactivo');
                    e.target.classList.add(nuevoEstado === 'Activo' ? 'estado-activo' : 'estado-inactivo');
                    validaciones.exito('Estado actualizado', `El participante se marcó como "${nuevoEstado}".`);
                } catch (error) {
                    e.target.value = nuevoEstado === 'Activo' ? 'Cancelado' : 'Activo';
                }
            });
        });

    } catch (err) {
        console.error('Error cargando participantes:', err);
        validaciones.alerta('Error', 'No se pudieron cargar los participantes.', 'error');
    }
}

// ── Modal editar ────────────────────────────────────────────────────────

function abrirModalEditarParticipante(id) {
    // Buscar la fila en la tabla para obtener los datos actuales
    const fila = document.querySelector(`.row-check[data-id="${id}"]`)?.closest('tr');
    if (!fila) return;

    const celdas = fila.querySelectorAll('td');
    editandoPartId = id;

    document.getElementById('edit-part-nombre').value   = celdas[2]?.textContent.trim() || '';
    document.getElementById('edit-part-id').value       = celdas[3]?.textContent.trim() || '';
    document.getElementById('edit-part-correo').value   = celdas[4]?.textContent.trim() || '';
    document.getElementById('edit-part-telefono').value = celdas[5]?.textContent.trim() || '';
    document.getElementById('edit-part-edad').value     = celdas[6]?.textContent.trim() || '';
    document.getElementById('edit-part-carrera').value  = celdas[7]?.textContent.trim() || '';

    validaciones.limpiarErrores();
    document.getElementById('modalEditarParticipante').classList.add('modal-visible');
}

// ── INICIALIZADOR PRINCIPAL ─────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {

    // Verificar sesión contra el servidor
    const usuario = await apiSesion();
    if (!usuario) {
        window.location.href = 'login.html';
        return;
    }

    document.getElementById('headerUserName').textContent = usuario.nombre || 'Administrador';
    document.getElementById('headerUserRol').textContent  = usuario.rol    || '';

    // Cerrar sesión
    document.getElementById('btnLogOut').addEventListener('click', async (e) => {
        e.preventDefault();
        const confirmar = await validaciones.confirmar('¿Cerrar sesión?', 'Se cerrará tu sesión actual.');
        if (!confirmar) return;
        window.cerrarSesion();
    });

    // Render inicial
    renderizarTablaParticipantes();

    // Select all
    document.getElementById('selectAll').addEventListener('change', (e) => {
        document.querySelectorAll('.row-check').forEach(cb => {
            cb.checked = e.target.checked;
        });
    });

    // Filtros en tiempo real
    document.getElementById('searchInput').addEventListener('input', renderizarTablaParticipantes);
    document.getElementById('buscar-participante')?.addEventListener('click', renderizarTablaParticipantes);
    document.getElementById('filtro-estado').addEventListener('change', renderizarTablaParticipantes);
    document.getElementById('filtro-fecha').addEventListener('change', renderizarTablaParticipantes);

    // ── Editar participante ─────────────────────────────────────────────
    document.getElementById('btnEditarParticipante')?.addEventListener('click', () => {
        const seleccionados = [...document.querySelectorAll('.row-check:checked')].map(cb => cb.dataset.id);
        if (seleccionados.length === 0) {
            validaciones.alerta('Seleccione un participante', 'Debe seleccionar un participante para editar.', 'warning');
            return;
        }
        if (seleccionados.length > 1) {
            validaciones.alerta('Solo uno a la vez', 'Solo puede editar un participante a la vez.', 'warning');
            return;
        }
        abrirModalEditarParticipante(seleccionados[0]);
    });

    // ── Eliminar participante ───────────────────────────────────────────
    document.getElementById('btnEliminarParticipante')?.addEventListener('click', async () => {
        const seleccionados = [...document.querySelectorAll('.row-check:checked')].map(cb => cb.dataset.id);
        if (seleccionados.length === 0) {
            validaciones.alerta('Seleccione participantes', 'Seleccione al menos un participante para eliminar.', 'warning');
            return;
        }
        const confirmar = await validaciones.confirmar(
            '¿Eliminar participante(s)?',
            `Se eliminarán ${seleccionados.length} participante(s). Esta acción no se puede deshacer.`
        );
        if (!confirmar) return;

        try {
            await Promise.all(seleccionados.map(id => apiDelete(`/api/participantes/${id}`)));
            validaciones.exito('Eliminado', 'Los participantes fueron eliminados correctamente.');
            renderizarTablaParticipantes();
        } catch (err) {
            validaciones.alerta('Error', err.mensaje || 'No se pudo eliminar el participante.', 'error');
        }
    });

    // ── Modal editar — cerrar ───────────────────────────────────────────
    const modalEditar = document.getElementById('modalEditarParticipante');

    const cerrarModalEditar = () => {
        modalEditar.classList.remove('modal-visible');
        editandoPartId = null;
        validaciones.limpiarErrores();
    };

    document.getElementById('btnCerrarEditarPart')?.addEventListener('click', cerrarModalEditar);
    document.getElementById('btnCancelarEditarPart')?.addEventListener('click', cerrarModalEditar);
    modalEditar?.addEventListener('click', (e) => {
        if (e.target === modalEditar) cerrarModalEditar();
    });

    // ── Modal editar — guardar ──────────────────────────────────────────
    document.getElementById('btnGuardarEditarPart')?.addEventListener('click', async () => {
        validaciones.limpiarErrores();
        let esValido = true;

        const nombre   = document.getElementById('edit-part-nombre').value.trim();
        const telefono = document.getElementById('edit-part-telefono').value.trim();
        const edad     = document.getElementById('edit-part-edad').value.trim();
        const carrera  = document.getElementById('edit-part-carrera').value.trim();

        if (!validaciones.validarNombre(nombre)) {
            validaciones.mostrarError('edit-part-nombre', 'El nombre debe tener al menos 3 caracteres.');
            esValido = false;
        }
        if (!validaciones.validarTelefono(telefono)) {
            validaciones.mostrarError('edit-part-telefono', 'Ingrese un teléfono válido (8 dígitos).');
            esValido = false;
        }
        if (!validaciones.validarEdad(edad)) {
            validaciones.mostrarError('edit-part-edad', 'Ingrese una edad válida (15-120).');
            esValido = false;
        }
        if (!validaciones.validarRequerido(carrera)) {
            validaciones.mostrarError('edit-part-carrera', 'La carrera es obligatoria.');
            esValido = false;
        }

        if (!esValido) return;

        try {
            await apiPut(`/api/participantes/${editandoPartId}`, {
                nombreCompleto: nombre,
                telefono,
                edad:    parseInt(edad, 10),
                carrera
            });
            cerrarModalEditar();
            renderizarTablaParticipantes();
            validaciones.exito('Actualizado', 'Los datos del participante fueron guardados.');
        } catch (err) {
            validaciones.alerta('Error', err.mensaje || 'No se pudo actualizar el participante.', 'error');
        }
    });
});

// Variable global para el ID en edición
let editandoPartId = null;
