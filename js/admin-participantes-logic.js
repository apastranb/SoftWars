// Cierre de sesión (disponible desde el layout de admin)
window.cerrarSesion = function () {
    localStorage.removeItem('sesionActiva');
    localStorage.removeItem('sesionEmail');
    localStorage.removeItem('sesionNombre');
    localStorage.removeItem('sesionRol');
    window.location.href = 'login.html';
};


// RENDERIZAR TABLA

const renderizarTablaParticipantes = () => {
    const tbody       = document.getElementById('tbody-participantes');
    const tablaVacia  = document.getElementById('tabla-vacia');
    const textoBusqueda     = document.getElementById('searchInput').value.trim().toLowerCase();
    const filtroEstado      = document.getElementById('filtro-estado').value;
    const filtroFecha       = document.getElementById('filtro-fecha').value;

    const participantes = window.db.participantes.filter(p => {
        const coincideTexto = !textoBusqueda ||
            p.nombreCompleto.toLowerCase().includes(textoBusqueda) ||
            p.correo.toLowerCase().includes(textoBusqueda) ||
            p.idDocumento.includes(textoBusqueda) ||
            p.carrera.toLowerCase().includes(textoBusqueda);

        const coincideEstado = !filtroEstado || p.estado === filtroEstado;
        const coincideFecha = !filtroFecha || p.fechaInscripcion === filtroFecha;

        return coincideTexto && coincideEstado && coincideFecha;
    });

    tbody.innerHTML = '';

    if (participantes.length === 0) {
        tablaVacia.style.display = 'block';
        return;
    }
    tablaVacia.style.display = 'none';

    participantes.forEach(p => {
        // Convertir los IDs de actividades a nombres legibles
        const nombresActividades = p.actividades
            .map(id => {
                const act = window.db.actividades.find(a => a.id === id);
                return act ? act.nombre : id;
            })
            .join(', ');

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><input type="checkbox" class="row-check" data-id="${p.id}"></td>
            <td>${p.id}</td>
            <td>${p.nombreCompleto}</td>
            <td>${p.idDocumento}</td>
            <td>${p.correo}</td>
            <td>${p.telefono}</td>
            <td>${p.edad}</td>
            <td>${p.carrera}</td>
            <td>${nombresActividades || '-'}</td>
            <td>
                <select class="tableSelectStatus" data-id="${p.id}">
                    <option value="Activo" ${p.estado === 'Activo' ? 'selected' : ''}>Activo</option>
                    <option value="Cancelado" ${p.estado === 'Cancelado' ? 'selected' : ''}>Cancelado</option>
                </select>
            </td>
            <td>${p.fechaInscripcion || '-'}</td>
        `;
        tbody.appendChild(tr);
    });

    // Select all reset
    const selectAllCb = document.getElementById('selectAll');
    if (selectAllCb) selectAllCb.checked = false;

    // Estado change listener
    tbody.querySelectorAll('.tableSelectStatus').forEach(select => {
        select.addEventListener('change', (e) => {
            const id = e.target.dataset.id;
            const participante = window.db.participantes.find(p => p.id === id);
            if (participante) participante.estado = e.target.value;
        });
    });
};



// INICIALIZADOR PRINCIPAL

document.addEventListener('DOMContentLoaded', () => {
    // Verificar sesión activa
    if (localStorage.getItem('sesionActiva') !== 'true') {
        window.location.href = 'login.html';
        return;
    }

    document.getElementById('headerUserName').textContent = localStorage.getItem('sesionNombre') || 'Administrador';
    document.getElementById('headerUserRol').textContent  = localStorage.getItem('sesionRol')    || '';

    // Cerrar sesión
    document.getElementById('btnLogOut').addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('sesionActiva');
        localStorage.removeItem('sesionEmail');
        localStorage.removeItem('sesionNombre');
        localStorage.removeItem('sesionRol');
        window.location.href = 'login.html';
    });

    renderizarTablaParticipantes();

    // Select all checkbox
    document.getElementById('selectAll').addEventListener('change', (e) => {
        document.querySelectorAll('.row-check').forEach(cb => {
            cb.checked = e.target.checked;
        });
    });

    // Toolbar: Editar (placeholder — participantes are read-only for now)
    document.getElementById('btnEditarParticipante')?.addEventListener('click', () => {
        const seleccionados = [...document.querySelectorAll('.row-check:checked')].map(cb => cb.dataset.id);
        if (seleccionados.length === 0) {
            alert('Seleccione un participante para editar.');
            return;
        }
        if (seleccionados.length > 1) {
            alert('Solo puede editar un participante a la vez.');
            return;
        }
        alert('Funcionalidad de edicion de participante pendiente (Fase 2).');
    });

    // Toolbar: Eliminar
    document.getElementById('btnEliminarParticipante')?.addEventListener('click', () => {
        const seleccionados = [...document.querySelectorAll('.row-check:checked')].map(cb => cb.dataset.id);
        if (seleccionados.length === 0) {
            alert('Seleccione al menos un participante para eliminar.');
            return;
        }
        const confirmar = confirm(`¿Eliminar ${seleccionados.length} participante(s)? Esta accion no se puede deshacer.`);
        if (!confirmar) return;
        window.db.participantes = window.db.participantes.filter(p => !seleccionados.includes(p.id));
        renderizarTablaParticipantes();
    });

    // Filtros en tiempo real
    document.getElementById('searchInput').addEventListener('input', renderizarTablaParticipantes);
    document.getElementById('buscar-participante')?.addEventListener('click', renderizarTablaParticipantes);
    document.getElementById('filtro-estado').addEventListener('change', renderizarTablaParticipantes);
    document.getElementById('filtro-fecha').addEventListener('change', renderizarTablaParticipantes);
});
