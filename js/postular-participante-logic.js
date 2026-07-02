// Expresión para validar formato de correo (misma convención usada en el resto del sitio)
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// --- FUNCIONES DE UTILIDAD ---
const mostrarError = (idCampo, mensaje) => {
    const spanError = document.getElementById(`error-${idCampo}`);
    if (spanError) {
        spanError.textContent = mensaje;
        spanError.classList.add('form__error-message--active');
    }
};

const limpiarErrores = () => {
    document.querySelectorAll('.form__error-message').forEach(span => {
        span.classList.remove('form__error-message--active');
        span.textContent = '';
    });
};

// Limpia el error de un solo campo (usado en validación en tiempo real - RF-32)
const limpiarError = (idCampo) => {
    const spanError = document.getElementById(`error-${idCampo}`);
    if (spanError) {
        spanError.textContent = '';
        spanError.classList.remove('form__error-message--active');
    }
};

const mostrarResultado = (id, mensaje, tipo) => {
    const span = document.getElementById(id);
    if (!span) return;
    span.textContent = mensaje;
    span.className = 'form__result-message form__result-message--' + tipo;
};

const ocultarResultado = (id) => {
    const span = document.getElementById(id);
    if (!span) return;
    span.textContent = '';
    span.className = 'form__result-message';
};

document.addEventListener('DOMContentLoaded', () => {

    // ==========================================================
    // TABS: Inscribirme / Cancelar Inscripción
    // ==========================================================
    const tabInscribirse = document.querySelector('#tab-inscribirse');
    const tabCancelar = document.querySelector('#tab-cancelar');
    const panelInscribirse = document.querySelector('#panel-inscribirse');
    const panelCancelar = document.querySelector('#panel-cancelar');

    tabInscribirse.addEventListener('click', () => {
        tabInscribirse.classList.add('active');
        tabCancelar.classList.remove('active');
        panelInscribirse.classList.remove('oculto');
        panelCancelar.classList.add('oculto');
    });

    tabCancelar.addEventListener('click', () => {
        tabCancelar.classList.add('active');
        tabInscribirse.classList.remove('active');
        panelCancelar.classList.remove('oculto');
        panelInscribirse.classList.add('oculto');
    });

    // ==========================================================
    // FILTROS DE ENTRADA (solo números en ID y teléfono)
    // ==========================================================
    const bloquearLetras = (e) => {
        e.target.value = e.target.value.replace(/[^0-9-]/g, '');
    };
    document.querySelector('#idDocumento').addEventListener('input', bloquearLetras);
    document.querySelector('#telefono').addEventListener('input', bloquearLetras);
    document.querySelector('#buscar-id').addEventListener('input', bloquearLetras);

    // ==========================================================
    // LISTAR ACTIVIDADES DISPONIBLES
    // ==========================================================
    const listaActividades = document.querySelector('#lista-actividades');

    const renderActividades = () => {
        listaActividades.innerHTML = '';

        window.db.actividades.forEach(act => {
            if (!act.requiereInscripcion) {
                // Actividad de entrada libre: informativa, sin checkbox
                const div = document.createElement('div');
                div.className = 'actividad-libre';
                div.innerHTML = `
                    <div class="info-actividad">
                        <span class="actividad-titulo">${act.nombre}</span>
                        <span class="actividad-meta"><i class="bi bi-clock"></i> ${act.fecha} · ${act.hora} · ${act.lugar}</span>
                    </div>
                    <span class="tag-entrada-libre">Entrada libre</span>
                `;
                listaActividades.appendChild(div);
                return;
            }

            const lleno = act.cupoActual >= act.cupoMaximo;
            const label = document.createElement('label');
            label.className = 'checkboxActivity' + (lleno ? ' actividad-deshabilitada' : '');
            label.innerHTML = `
                <input type="checkbox" name="actividades_seleccionadas" value="${act.id}" ${lleno ? 'disabled' : ''}>
                <div class="box-visual"></div>
                <div class="info-actividad">
                    <span class="actividad-titulo">${act.nombre}</span>
                    <span class="actividad-meta"><i class="bi bi-clock"></i> ${act.fecha} · ${act.hora} · ${act.lugar}</span>
                </div>
                <span class="actividad-cupo ${lleno ? 'lleno' : 'disponible'}">${lleno ? 'Cupo lleno' : `${act.cupoActual}/${act.cupoMaximo} cupos`}</span>
            `;
            listaActividades.appendChild(label);
        });
    };

    renderActividades();

    // ==========================================================
    // RF-26: Alerta de conflicto de horario entre actividades seleccionadas
    // ==========================================================
    const avisoHorario = document.querySelector('#warning-horario');

    const revisarConflictosHorario = () => {
        const seleccionadas = Array.from(
            document.querySelectorAll('input[name="actividades_seleccionadas"]:checked')
        ).map(cb => window.db.actividades.find(a => a.id === cb.value)).filter(Boolean);

        const conflictos = new Set();
        for (let i = 0; i < seleccionadas.length; i++) {
            for (let j = i + 1; j < seleccionadas.length; j++) {
                if (seleccionadas[i].fecha === seleccionadas[j].fecha && seleccionadas[i].hora === seleccionadas[j].hora) {
                    conflictos.add(seleccionadas[i].nombre);
                    conflictos.add(seleccionadas[j].nombre);
                }
            }
        }

        if (!avisoHorario) return;
        if (conflictos.size > 0) {
            avisoHorario.textContent = `Atención: estas actividades tienen el mismo horario y se superponen: ${Array.from(conflictos).join(', ')}.`;
            avisoHorario.classList.add('form__warning-message--active');
        } else {
            avisoHorario.textContent = '';
            avisoHorario.classList.remove('form__warning-message--active');
        }
    };

    listaActividades.addEventListener('change', (e) => {
        if (e.target.name === 'actividades_seleccionadas') revisarConflictosHorario();
    });

    // ==========================================================
    // ASISTENTES E INSCRIPCIONES: Validación en tiempo real (RF-32)
    // ==========================================================
    const formPostulacion = document.querySelector('#form-postulacion');
    const campoNombre = document.querySelector('#nombre');
    const campoId = document.querySelector('#idDocumento');
    const campoCorreo = document.querySelector('#correo');
    const campoTelefono = document.querySelector('#telefono');
    const campoEdad = document.querySelector('#edad');
    const campoCarrera = document.querySelector('#carrera');

    const validarNombre = () => {
        if (!campoNombre.value.trim()) {
            mostrarError('nombre', 'El nombre completo es requerido.');
            return false;
        }
        limpiarError('nombre');
        return true;
    };

    const validarIdDocumento = () => {
        const valor = campoId.value.trim();
        if (!valor) {
            mostrarError('idDocumento', 'La cédula o ID es requerida.');
            return false;
        }
        if (!validaciones.validarCedula(valor)) {
            mostrarError('idDocumento', 'Ingresa una cédula o ID válida (solo números, 8 a 12 dígitos).');
            return false;
        }
        limpiarError('idDocumento');
        return true;
    };

    const validarCorreo = () => {
        const valor = campoCorreo.value.trim();
        if (!valor) {
            mostrarError('correo', 'El correo es requerido.');
            return false;
        }
        if (!emailRegex.test(valor)) {
            mostrarError('correo', 'Ingresa un correo válido (ej: usuario@dominio.com).');
            return false;
        }
        limpiarError('correo');
        return true;
    };

    const validarTelefono = () => {
        const valor = campoTelefono.value.trim();
        if (!valor) {
            mostrarError('telefono', 'El teléfono es requerido.');
            return false;
        }
        if (!validaciones.validarTelefono(valor)) {
            mostrarError('telefono', 'Ingresa un teléfono válido de 8 dígitos (ej: 8888-8888).');
            return false;
        }
        limpiarError('telefono');
        return true;
    };

    const validarEdad = () => {
        const valor = campoEdad.value.trim();
        if (!valor) {
            mostrarError('edad', 'La edad es requerida.');
            return false;
        }
        if (isNaN(valor) || valor < 15 || valor > 100) {
            mostrarError('edad', 'Ingresa una edad válida (15-100).');
            return false;
        }
        limpiarError('edad');
        return true;
    };

    const validarCarrera = () => {
        if (!campoCarrera.value.trim()) {
            mostrarError('carrera', 'La carrera o profesión es requerida.');
            return false;
        }
        limpiarError('carrera');
        return true;
    };

    campoNombre.addEventListener('blur', validarNombre);
    campoId.addEventListener('blur', validarIdDocumento);
    campoCorreo.addEventListener('blur', validarCorreo);
    campoTelefono.addEventListener('blur', validarTelefono);
    campoEdad.addEventListener('blur', validarEdad);
    campoCarrera.addEventListener('blur', validarCarrera);

    // ==========================================================
    // ASISTENTES E INSCRIPCIONES: Envío del formulario
    // ==========================================================
    formPostulacion.addEventListener('submit', (e) => {
        e.preventDefault();
        limpiarErrores();
        ocultarResultado('resultado-inscripcion');

        const nombre = campoNombre.value.trim();
        const idDocumento = campoId.value.trim();
        const correo = campoCorreo.value.trim();
        const telefono = campoTelefono.value.trim();
        const edad = campoEdad.value.trim();
        const carrera = campoCarrera.value.trim();
        const actividadesSeleccionadas = Array.from(
            document.querySelectorAll('input[name="actividades_seleccionadas"]:checked')
        ).map(cb => cb.value);

        const esValido = [
            validarNombre(),
            validarIdDocumento(),
            validarCorreo(),
            validarTelefono(),
            validarEdad(),
            validarCarrera()
        ].every(Boolean);

        if (!esValido) return;

        if (actividadesSeleccionadas.length === 0) {
            mostrarError('actividades', 'Selecciona al menos una actividad.');
            return;
        }

        // --- Control: un responsable no puede inscribirse a un evento que él mismo organiza ---
        const responsable = window.db.responsables.find(
            r => r.correo.toLowerCase() === correo.toLowerCase()
        );

        if (responsable) {
            const eventosPropios = window.db.eventos
                .filter(ev => ev.responsableCorreo.toLowerCase() === responsable.correo.toLowerCase())
                .map(ev => ev.id);

            const actividadesPropias = actividadesSeleccionadas.filter(actId => {
                const actividad = window.db.actividades.find(a => a.id === actId);
                return actividad && eventosPropios.includes(actividad.eventoId);
            });

            if (actividadesPropias.length > 0) {
                mostrarError('actividades', 'No puedes inscribirte a actividades de un evento que tú mismo organizas.');
                return;
            }
        }

        // --- RF-25: el correo es el identificador único por actividad, no de forma global ---
        const inscripcionExistente = window.db.participantes.find(p =>
            p.estado === 'Activo' && p.correo.toLowerCase() === correo.toLowerCase()
        );

        if (inscripcionExistente && inscripcionExistente.idDocumento !== idDocumento) {
            mostrarError('correo', 'Este correo ya tiene una inscripción activa con otra cédula/ID. Verifica tus datos.');
            return;
        }

        const idYaUsadoPorOtroCorreo = window.db.participantes.find(p =>
            p.estado === 'Activo' &&
            p.idDocumento === idDocumento &&
            p.correo.toLowerCase() !== correo.toLowerCase()
        );

        if (idYaUsadoPorOtroCorreo) {
            mostrarError('idDocumento', 'Esta cédula/ID ya tiene una inscripción activa con otro correo.');
            return;
        }

        if (inscripcionExistente) {
            const actividadesRepetidas = actividadesSeleccionadas.filter(id => inscripcionExistente.actividades.includes(id));

            if (actividadesRepetidas.length > 0) {
                const nombres = actividadesRepetidas
                    .map(id => window.db.actividades.find(a => a.id === id)?.nombre)
                    .filter(Boolean)
                    .join(', ');
                mostrarError('actividades', `Ya estás inscrito en: ${nombres}. Selecciona actividades diferentes.`);
                return;
            }

            const actividadesNuevas = actividadesSeleccionadas.filter(id => !inscripcionExistente.actividades.includes(id));

            inscripcionExistente.actividades.push(...actividadesNuevas);
            inscripcionExistente.nombreCompleto = nombre;
            inscripcionExistente.telefono = telefono;
            inscripcionExistente.edad = parseInt(edad, 10);
            inscripcionExistente.carrera = carrera;

            actividadesNuevas.forEach(actId => {
                const actividad = window.db.actividades.find(a => a.id === actId);
                if (actividad) actividad.cupoActual += 1;
            });

            formPostulacion.reset();
            renderActividades();
            revisarConflictosHorario();
            mostrarResultado('resultado-inscripcion', 'Se agregaron las nuevas actividades a tu inscripción existente.', 'success');
            return;
        }

        // --- Registrar inscripción nueva ---
        const nuevoId = `P-${String(window.db.participantes.length + 1).padStart(3, '0')}`;
        window.db.participantes.push({
            id: nuevoId,
            idDocumento,
            nombreCompleto: nombre,
            correo,
            telefono,
            edad: parseInt(edad, 10),
            carrera,
            actividades: actividadesSeleccionadas,
            estado: 'Activo',
            fechaInscripcion: new Date().toISOString().slice(0, 10)
        });

        actividadesSeleccionadas.forEach(actId => {
            const actividad = window.db.actividades.find(a => a.id === actId);
            if (actividad) actividad.cupoActual += 1;
        });

        formPostulacion.reset();
        renderActividades();
        revisarConflictosHorario();
        mostrarResultado('resultado-inscripcion', '¡Postulación enviada con éxito! Ya estás inscrito en las actividades seleccionadas.', 'success');
    });

    // ==========================================================
    // CANCELAR INSCRIPCIÓN
    // ==========================================================
    const resultadoBusqueda = document.querySelector('#resultado-busqueda');

    const renderParticipanteEncontrado = (participante) => {
        resultadoBusqueda.innerHTML = '';

        const card = document.createElement('div');
        card.className = 'participante-card';

        const actividadesHtml = participante.actividades.map(actId => {
            const act = window.db.actividades.find(a => a.id === actId);
            if (!act) return '';
            return `
                <div class="actividad-cancelar-row">
                    <span>${act.nombre} <span class="actividad-meta">(${act.fecha} · ${act.hora})</span></span>
                    <button type="button" class="btn-cancelar-actividad" data-actividad="${act.id}">Cancelar</button>
                </div>
            `;
        }).join('');

        card.innerHTML = `
            <h4>${participante.nombreCompleto}</h4>
            <p>${participante.correo} · ${participante.idDocumento}</p>
            ${actividadesHtml || '<p>No tienes actividades activas.</p>'}
        `;

        resultadoBusqueda.appendChild(card);

        card.querySelectorAll('.btn-cancelar-actividad').forEach(btn => {
            btn.addEventListener('click', () => {
                const actId = btn.dataset.actividad;

                // Quitar la actividad de la inscripción del participante
                participante.actividades = participante.actividades.filter(id => id !== actId);

                // Liberar el cupo
                const actividad = window.db.actividades.find(a => a.id === actId);
                if (actividad && actividad.cupoActual > 0) actividad.cupoActual -= 1;

                // Si ya no tiene actividades, se marca la inscripción como cancelada
                if (participante.actividades.length === 0) {
                    participante.estado = 'Cancelado';
                }

                renderActividades();

                if (participante.estado === 'Cancelado') {
                    resultadoBusqueda.innerHTML = '<p class="form__result-message form__result-message--success">Tu inscripción fue cancelada por completo.</p>';
                } else {
                    renderParticipanteEncontrado(participante);
                }
            });
        });
    };

    const buscarCorreoInput = document.querySelector('#buscar-correo');
    const buscarIdInput = document.querySelector('#buscar-id');

    const validarBuscarCorreo = () => {
        const valor = buscarCorreoInput.value.trim();
        if (!valor) {
            mostrarError('buscar-correo', 'Ingresa el correo con el que te inscribiste.');
            return false;
        }
        if (!emailRegex.test(valor)) {
            mostrarError('buscar-correo', 'Ingresa un correo válido.');
            return false;
        }
        limpiarError('buscar-correo');
        return true;
    };

    const validarBuscarId = () => {
        const valor = buscarIdInput.value.trim();
        if (!valor) {
            mostrarError('buscar-id', 'Ingresa tu cédula o ID.');
            return false;
        }
        if (!validaciones.validarCedula(valor)) {
            mostrarError('buscar-id', 'Ingresa una cédula o ID válida (solo números, 8 a 12 dígitos).');
            return false;
        }
        limpiarError('buscar-id');
        return true;
    };

    buscarCorreoInput.addEventListener('blur', validarBuscarCorreo);
    buscarIdInput.addEventListener('blur', validarBuscarId);

    document.querySelector('#btnBuscarInscripcion').addEventListener('click', () => {
        resultadoBusqueda.innerHTML = '';

        const correo = buscarCorreoInput.value.trim();
        const idDocumento = buscarIdInput.value.trim();

        const esValido = validarBuscarCorreo() && validarBuscarId();
        if (!esValido) return;

        const participante = window.db.participantes.find(p =>
            p.estado === 'Activo' &&
            p.correo.toLowerCase() === correo.toLowerCase() &&
            p.idDocumento === idDocumento
        );

        if (!participante) {
            mostrarError('buscar-correo', 'No se encontró ninguna inscripción activa con esos datos.');
            return;
        }

        renderParticipanteEncontrado(participante);
    });
});
