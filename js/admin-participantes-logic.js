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

    const participantes = window.db.participantes.filter(p => {
        const coincideTexto = !textoBusqueda ||
            p.nombreCompleto.toLowerCase().includes(textoBusqueda) ||
            p.correo.toLowerCase().includes(textoBusqueda) ||
            p.idDocumento.includes(textoBusqueda);

        const coincideEstado = !filtroEstado || p.estado === filtroEstado;

        return coincideTexto && coincideEstado;
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
            <td>${p.id}</td>
            <td>${p.nombreCompleto}</td>
            <td>${p.idDocumento}</td>
            <td>${p.correo}</td>
            <td>${p.telefono}</td>
            <td>${p.edad}</td>
            <td>${p.carrera}</td>
            <td>${nombresActividades || '-'}</td>
            <td><span class="badge ${p.estado === 'Activo' ? 'badge-active' : 'badge-inactive'}">${p.estado}</span></td>
            <td>${p.fechaInscripcion || '-'}</td>
        `;
        tbody.appendChild(tr);
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

    renderizarTablaParticipantes();

    // Filtros en tiempo real
    document.getElementById('searchInput').addEventListener('input', renderizarTablaParticipantes);
    document.getElementById('buscar-participante').addEventListener('click', renderizarTablaParticipantes);
    document.getElementById('filtro-estado').addEventListener('change', renderizarTablaParticipantes);
});
