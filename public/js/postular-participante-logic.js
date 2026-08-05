// ==========================================================================
// MÓDULO: POSTULACIÓN PÚBLICA DE ORADOR / PRESENTADOR (RF-24)
// Consume POST /api/postulaciones y GET /api/actividades
// ==========================================================================

document.addEventListener('DOMContentLoaded', async () => {

    // Inicializar navbar search dropdown
    if (validaciones && validaciones.inicializarNavbarSearch) {
        validaciones.inicializarNavbarSearch('');
    }

    // ── Referencias al DOM ──────────────────────────────────────────────────
    const form = document.getElementById('form-postulacion');
    const campoNombre = document.getElementById('nombre');
    const campoCorreo = document.getElementById('correo');
    const campoTelefono = document.getElementById('telefono');
    const campoTelefono2 = document.getElementById('telefono2');
    const campoEspecialidad = document.getElementById('especialidad');
    const campoOrganizacion = document.getElementById('organizacion');
    const campoBiografia = document.getElementById('biografia');
    const campoFoto = document.getElementById('foto');
    const campoActividad = document.getElementById('actividad');
    const fotoPreview = document.getElementById('fotoPreview');

    let fotoDataUrl = null;

    // ── Poblar select de actividades desde la API ───────────────────────────
    const poblarActividades = async () => {
        if (!campoActividad) return;
        campoActividad.innerHTML = '<option value="">Seleccionar actividad...</option>';
        try {
            const respuesta = await apiGet('actividades');
            const actividades = Array.isArray(respuesta) ? respuesta : (respuesta.data || []);
            actividades.forEach(act => {
                if (act.visibilidad === 'privada') return;
                const actId = act._id || act.id || act.codigo;
                const opt = document.createElement('option');
                opt.value = actId;
                opt.textContent = `${act.nombre} — ${act.fecha}`;
                campoActividad.appendChild(opt);
            });
        } catch (error) {
            console.error('Error cargando actividades:', error);
        }
    };

    await poblarActividades();

    // ── Vista previa de foto ────────────────────────────────────────────────
    if (campoFoto) {
        campoFoto.addEventListener('change', () => {
            const archivo = campoFoto.files[0];
            if (!archivo) return;
            const reader = new FileReader();
            reader.onload = (e) => {
                fotoDataUrl = e.target.result;
                if (fotoPreview) fotoPreview.src = fotoDataUrl;
            };
            reader.readAsDataURL(archivo);
        });
    }

    // ── Filtro: solo números en teléfono ────────────────────────────────────
    const bloquearLetras = (e) => {
        e.target.value = e.target.value.replace(/[^0-9-]/g, '');
    };
    if (campoTelefono) campoTelefono.addEventListener('input', bloquearLetras);
    if (campoTelefono2) campoTelefono2.addEventListener('input', bloquearLetras);

    // ── Validaciones individuales (blur) ────────────────────────────────────

    const validarNombre = () => {
        const valor = campoNombre.value.trim();
        if (!valor) { validaciones.mostrarError('nombre', 'El nombre completo es requerido.'); return false; }
        if (!validaciones.validarNombre(valor)) { validaciones.mostrarError('nombre', 'El nombre debe tener al menos 3 caracteres.'); return false; }
        validaciones.limpiarError('nombre');
        return true;
    };

    const validarCorreo = () => {
        const valor = campoCorreo.value.trim();
        if (!valor) { validaciones.mostrarError('correo', 'El correo es requerido.'); return false; }
        if (!validaciones.validarCorreo(valor)) { validaciones.mostrarError('correo', 'Ingrese un correo electrónico válido.'); return false; }
        validaciones.limpiarError('correo');
        return true;
    };

    const validarTelefono = () => {
        const valor = campoTelefono.value.trim();
        if (!valor) { validaciones.mostrarError('telefono', 'El teléfono principal es requerido.'); return false; }
        if (!validaciones.validarTelefono(valor)) { validaciones.mostrarError('telefono', 'Ingrese un número de teléfono válido (8 dígitos).'); return false; }
        validaciones.limpiarError('telefono');
        return true;
    };

    const validarTelefono2 = () => {
        const valor = campoTelefono2.value.trim();
        if (!valor) { validaciones.limpiarError('telefono2'); return true; }
        if (!validaciones.validarTelefono(valor)) { validaciones.mostrarError('telefono2', 'Ingrese un número de teléfono válido (8 dígitos).'); return false; }
        validaciones.limpiarError('telefono2');
        return true;
    };

    const validarEspecialidad = () => {
        const valor = campoEspecialidad.value.trim();
        if (!valor) { validaciones.mostrarError('especialidad', 'El área o especialidad es requerida.'); return false; }
        if (!validaciones.validarNombre(valor)) { validaciones.mostrarError('especialidad', 'La especialidad debe tener al menos 3 caracteres.'); return false; }
        validaciones.limpiarError('especialidad');
        return true;
    };

    const validarOrganizacion = () => {
        const valor = campoOrganizacion.value.trim();
        if (!valor) { validaciones.mostrarError('organizacion', 'La institución u organización es requerida.'); return false; }
        validaciones.limpiarError('organizacion');
        return true;
    };

    const validarBiografia = () => {
        const valor = campoBiografia.value.trim();
        if (!valor) { validaciones.mostrarError('biografia', 'La biografía es requerida.'); return false; }
        if (!validaciones.validarDescripcion(valor, true)) { validaciones.mostrarError('biografia', 'La biografía no puede superar los 200 caracteres.'); return false; }
        validaciones.limpiarError('biografia');
        return true;
    };

    const validarActividad = () => {
        if (!campoActividad.value) { validaciones.mostrarError('actividad', 'Debe seleccionar una actividad.'); return false; }
        validaciones.limpiarError('actividad');
        return true;
    };

    // Blur events
    campoNombre.addEventListener('blur', validarNombre);
    campoCorreo.addEventListener('blur', validarCorreo);
    campoTelefono.addEventListener('blur', validarTelefono);
    campoTelefono2.addEventListener('blur', validarTelefono2);
    campoEspecialidad.addEventListener('blur', validarEspecialidad);
    campoOrganizacion.addEventListener('blur', validarOrganizacion);
    campoBiografia.addEventListener('blur', validarBiografia);
    campoActividad.addEventListener('blur', validarActividad);

    // ── Envío del formulario ────────────────────────────────────────────────

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        validaciones.limpiarErrores();

        const esValido = [
            validarNombre(),
            validarCorreo(),
            validarTelefono(),
            validarTelefono2(),
            validarEspecialidad(),
            validarOrganizacion(),
            validarBiografia(),
            validarActividad()
        ].every(Boolean);

        if (!esValido) return;

        // Construir array de teléfonos
        const telefonos = [campoTelefono.value.trim()];
        if (campoTelefono2.value.trim()) {
            telefonos.push(campoTelefono2.value.trim());
        }

        const datos = {
            nombre: campoNombre.value.trim(),
            correo: campoCorreo.value.trim(),
            telefonos: telefonos,
            especialidad: campoEspecialidad.value.trim(),
            empresa: campoOrganizacion.value.trim(),
            biografia: campoBiografia.value.trim(),
            foto: fotoDataUrl,
            actividadId: campoActividad.value
        };

        try {
            await apiPost('postulaciones', datos);
            form.reset();
            fotoDataUrl = null;
            if (fotoPreview) fotoPreview.src = '../img/img-placeholder.png';
            validaciones.exito('Postulación enviada', 'Un administrador revisará tu solicitud.');
        } catch (error) {
            // apiPost ya muestra el error con SweetAlert2
        }
    });
});
