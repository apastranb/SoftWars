document.addEventListener('DOMContentLoaded', () => {
    // Verificar sesión activa
    if (localStorage.getItem('sesionActiva') !== 'true') {
        window.location.href = 'login.html';
        return;
    }

    // Abrir / cerrar modal de registrar presentador
    const modalCrearOrador = document.getElementById('modalCrearOrador');
    const btnCrearOrador   = document.getElementById('btnCrearOrador');
    const btnCerrarModal   = document.getElementById('btnCerrarModal');
    const btnCancelarModal = document.getElementById('btnCancelarModal');

    if (btnCrearOrador) {
        btnCrearOrador.addEventListener('click', () => modalCrearOrador.classList.add('active'));
    }
    if (btnCerrarModal) {
        btnCerrarModal.addEventListener('click', () => modalCrearOrador.classList.remove('active'));
    }
    if (btnCancelarModal) {
        btnCancelarModal.addEventListener('click', () => modalCrearOrador.classList.remove('active'));
    }
    if (modalCrearOrador) {
        modalCrearOrador.addEventListener('click', (e) => {
            if (e.target === modalCrearOrador) modalCrearOrador.classList.remove('active');
        });
    }
});
