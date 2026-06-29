document.addEventListener('DOMContentLoaded', () => {
    // Simulación de data-store.js temporal para pintar la tabla
    const mockUsers = [
        { id: 1, nombre: 'Carlos', correo: 'carlos@softwars.com', rol: 'Líder Técnico', estado: 'Activo' },
        { id: 2, nombre: 'Kenner', correo: 'kenner@softwars.com', rol: 'QA Leader', estado: 'Activo' },
        { id: 3, nombre: 'Adonis', correo: 'adonis@softwars.com', rol: 'Infraestructura', estado: 'Inactivo' }
    ];

    const tbody = document.querySelector('#tbody-usuarios');

    // HU-05 & HU-36: Listar Usuarios
    function renderTabla(usuarios) {
        tbody.innerHTML = '';
        usuarios.forEach(user => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${user.nombre}</td>
                <td>${user.correo}</td>
                <td>${user.rol}</td>
                <td>
                    <span class="badge ${user.estado.toLowerCase()}">${user.estado}</span>
                </td>
                <td>
                    <!-- HU-06: Modificar -->
                    <button class="btn-edit" onclick="editarUsuario(${user.id})">Editar</button>
                    <!-- HU-08: Asignar Roles -->
                    <button class="btn-role" onclick="asignarRol(${user.id})">Roles</button>
                    <!-- HU-07: Cambiar Estado -->
                    <button class="btn-status" onclick="toggleEstado(${user.id})">Cambiar Estado</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    renderTabla(mockUsers);

    // Funciones globales para los botones de acción
    window.editarUsuario = (id) => {
        console.log(`Abriendo formulario para editar usuario ${id}...`);
        // Aquí conectas con tu modal de edición
    };

    window.asignarRol = (id) => {
        console.log(`Abriendo gestión de roles para usuario ${id}...`);
        // Aquí abres el selector de roles
    };

    window.toggleEstado = (id) => {
        // En un caso real, actualizas el array/localstorage y vuelves a renderizar
        console.log(`Cambiando estado del usuario ${id}...`);
        alert('Estado modificado exitosamente');
    };
});
