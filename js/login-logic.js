document.addEventListener('DOMContentLoaded', () => {
    const formLogin = document.querySelector('#form-login');

    // HU-01: Iniciar Sesión
    formLogin.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.querySelector('#email').value;
        const password = document.querySelector('#password').value;

        // Aquí utilizarías validaciones.js y buscarías en data-store.js
        if(email && password) {
            // Simulación de éxito
            localStorage.setItem('sesionActiva', 'true');
            window.location.href = 'admin-usuarios.html';
        } else {
            alert('Por favor, completa todos los campos.');
        }
    });

    // HU-02: Cerrar Sesión (Esta función se llamaría desde el layout de admin)
    window.cerrarSesion = function() {
        localStorage.removeItem('sesionActiva');
        window.location.href = 'login.html';
    };
});
