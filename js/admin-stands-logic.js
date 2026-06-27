document.addEventListener('DOMContentLoaded', () => {

    const modalCrearStand  = document.getElementById('modalCrearStand');
    const btnCrearStand    = document.getElementById('btnCrearStand');
    const btnCerrarModal   = document.getElementById('btnCerrarModal');
    const btnCancelarModal = document.getElementById('btnCancelarModal');

    btnCrearStand.addEventListener('click', () => {
        modalCrearStand.classList.add('active');
    });

    btnCerrarModal.addEventListener('click', () => {
        modalCrearStand.classList.remove('active');
    });

    btnCancelarModal.addEventListener('click', () => {
        modalCrearStand.classList.remove('active');
    });

    // Cerrar si el usuario hace clic fuera del modal
    modalCrearStand.addEventListener('click', (e) => {
        if (e.target === modalCrearStand) {
            modalCrearStand.classList.remove('active');
        }
    });

});
