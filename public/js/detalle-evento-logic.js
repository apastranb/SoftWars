// ==========================================================================
// DETALLE EVENTO: Renderiza dinamicamente desde URL param ?id=XXX
// Consume GET /api/eventos/:id y POST /api/inscripciones
// ==========================================================================

const mostrarError = (idCampo, mensaje) => { validaciones.mostrarError(idCampo, mensaje); };
const limpiarErrores = () => { validaciones.limpiarErrores(); };

// ── RENDERIZADO DEL EVENTO ──────────────────────────────────────────────

const renderizarEvento = (evento) => {
    document.querySelector('.eventTitle').textContent = evento.nombre;
    document.querySelector('.eventDate').innerHTML = `<i class="bi bi-calendar"></i> ${evento.fechaInicio}${evento.fechaFin !== evento.fechaInicio ? ' al ' + evento.fechaFin : ''}`;
    document.querySelector('.eventTime').innerHTML = `<i class="bi bi-alarm"></i> ${evento.horaInicio} - ${evento.horaFin}`;
    document.querySelector('.eventLocation').innerHTML = `<i class="bi bi-geo-alt-fill"></i> ${evento.lugar}`;
    document.querySelector('.eventClass').innerHTML = `<i class="bi bi-ticket-perforated"></i> ${evento.tipoEntrada === 'libre' || evento.entradaLibre ? 'Entrada Libre' : 'De Pago'}`;
    document.querySelector('.eventEntry').innerHTML = `<i class="bi bi-check-circle-fill"></i> ${evento.visibilidad === 'publico' ? 'Publico' : 'Privado'}`;
    document.querySelector('.eventDescription').innerHTML = `<p>${evento.descripcion}</p>`;
};

// ── RENDERIZADO DE ACTIVIDADES ──────────────────────────────────────────

const renderizarActividades = (actividades) => {
    const container = document.querySelector('.eventActivities');
    if (!container) return;

    const publicas = actividades.filter(a => a.visibilidad === 'publica');

    if (publicas.length === 0) {
        container.innerHTML = '<h2><i class="bi bi-calendar-check"></i> Actividades</h2><p>No hay actividades publicas para este evento.</p>';
        return;
    }

    let html = '<h2><i class="bi bi-calendar-check"></i> Actividades</h2>';
    publicas.forEach(act => {
        const cupoTexto = act.entradaLibre ? 'Entrada Libre' : `${act.cupoOcupado}/${act.cupoMaximo} cupos`;
        html += `
            <div class="eventActivityCard">
                <span class="eventActivityHeader">
                    <h3 class="eventActivityTitle">${act.nombre}</h3>
                    <p class="eventActivityCategory">${act.categoria}</p>
                </span>
                <p class="eventActivityDescription">${act.descripcion || ''}</p>
                <p class="eventActivityDateTime"><i class="bi bi-alarm"></i> ${act.fecha} | ${act.horaInicio} - ${act.horaFin} | ${act.lugar}</p>
                <p class="eventActivityDateTime"><i class="bi bi-people"></i> ${cupoTexto}</p>
            </div>
        `;
    });
    container.innerHTML = html;
};

// ── RENDERIZADO DE AGENDA (tabs por día, consume GET /api/eventos/agenda/:eventoId) ──

const renderizarAgenda = async (eventoId) => {
    const section = document.querySelector('.eventAgenda');
    if (!section) return;

    try {
        const res = await fetch(`/api/eventos/agenda/${eventoId}`);
        const data = await res.json();

        if (!res.ok || data.error || !data.agenda || data.agenda.length === 0) {
            section.innerHTML = `
                <div class="eventAgendaHeader">
                    <h2><i class="bi bi-journal"></i> Agenda del Evento</h2>
                </div>
                <p>No hay actividades programadas.</p>
            `;
            return;
        }

        const { agenda } = data;

        let html = `
            <div class="eventAgendaHeader">
                <h2><i class="bi bi-journal"></i> Agenda del Evento</h2>
                <button class="btnExportAgenda" id="btnExportAgenda">
                    <i class="bi bi-download"></i> <span>Exportar Agenda</span>
                </button>
            </div>
        `;

        html += '<div class="eventAgendaDatesTab">';
        agenda.forEach((dia, i) => {
            html += `<button class="eventAgendaDatesTabLinks ${i === 0 ? 'active' : ''}" data-day="agenda-${i}">${dia.fecha}</button>`;
        });
        html += '</div>';

        agenda.forEach((dia, i) => {
            html += `
                <div id="agenda-${i}" class="eventAgendaTable ${i > 0 ? 'oculto' : ''}">
                    <table>
                        <thead>
                            <tr>
                                <th>Hora</th>
                                <th>Actividad</th>
                                <th>Responsable</th>
                                <th>Refrigerio</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            dia.actividades.forEach(act => {
                html += `
                    <tr>
                        <td>${act.horaInicio} - ${act.horaFin}</td>
                        <td><strong>${act.nombre}</strong><br><small>${act.descripcion || ''}</small></td>
                        <td>${act.responsableNombre || '—'}</td>
                        <td>${act.incluyeRefrigerio ? '<i class="bi bi-cup-hot"></i> Sí' : 'No'}</td>
                    </tr>
                `;
            });
            html += '</tbody></table></div>';
        });

        section.innerHTML = html;

        // Inicializar tabs
        section.querySelectorAll('.eventAgendaDatesTabLinks').forEach(btn => {
            btn.addEventListener('click', (evt) => {
                const day = evt.currentTarget.dataset.day;
                section.querySelectorAll('.eventAgendaTable').forEach(t => t.classList.add('oculto'));
                section.querySelectorAll('.eventAgendaDatesTabLinks').forEach(l => l.classList.remove('active'));
                document.getElementById(day).classList.remove('oculto');
                evt.currentTarget.classList.add('active');
            });
        });

        const btnExport = document.getElementById('btnExportAgenda');
        if (btnExport) btnExport.addEventListener('click', () => window.print());

    } catch (err) {
        console.error('Error cargando agenda:', err);
        section.innerHTML = `
            <div class="eventAgendaHeader">
                <h2><i class="bi bi-journal"></i> Agenda del Evento</h2>
            </div>
            <p>Error al cargar la agenda.</p>
        `;
    }
};

// ── RENDERIZADO DE PRESENTADORES ────────────────────────────────────────

const renderizarPresentadores = (oradores) => {
    const section = document.querySelector('.eventParticipants');
    if (!section) return;

    let html = `
        <div class="eventParticipantsHeader">
            <h2><i class="bi bi-people-fill"></i> Presentadores</h2>
            <a class="btnPostularse" target="_blank" href="postular-participante.html">Postularse como presentador</a>
        </div>
        <div class="eventParticipantsContainer">
    `;

    if (!oradores || oradores.length === 0) {
        html += '<p>No hay presentadores asignados.</p>';
    } else {
        oradores.forEach(o => {
            html += `
                <div class="eventParticipantsCard">
                    <img src="${o.foto || '../img/img-placeholder.png'}" alt="${o.nombre}" />
                    <h3 class="eventParticipantsName">${o.nombre}</h3>
                    <p class="eventParticipantsSubTitle">${o.especialidad || ''} ${o.empresa ? '- ' + o.empresa : ''}</p>
                    <span class="eventParticipantsBio">${o.biografia || ''}</span>
                </div>
            `;
        });
    }

    html += '</div>';
    section.innerHTML = html;
};

// ── RENDERIZADO DE STANDS ───────────────────────────────────────────────

const renderizarStands = (stands) => {
    const section = document.querySelector('.eventStands');
    if (!section) return;

    // Filtrar solo aprobados
    const aprobados = (stands || []).filter(s => 
        s.estado && s.estado.toLowerCase() === 'aprobado'
    );

    let html = '<h2><i class="bi bi-shop-window"></i> Stands</h2>';

    if (aprobados.length === 0) {
        html += '<p>No hay stands asignados a este evento.</p>';
    } else {
        aprobados.forEach(s => {
            html += `
                <div class="eventStandsCard">
                    <div class="standCategoryIcon">
                        <img src="../img/img-placeholder.png" alt="${s.nombre}" />
                    </div>
                    <div>
                        <h3 class="standName">${s.nombre}</h3>
                        <p class="standDescription">${s.descripcion || ''} — ${s.encargado || ''} (${s.empresa || ''})</p>
                    </div>
                </div>
            `;
        });
    }

    section.innerHTML = html;
};

// ── RENDERIZADO DE CHECKBOXES DE ACTIVIDADES (formulario inscripción) ───

const renderizarCheckboxesActividades = (actividades) => {
    const container = document.getElementById('checkboxes-actividades');
    if (!container) return;

    container.innerHTML = '';
    const publicas = actividades.filter(a => a.visibilidad === 'publica');

    publicas.forEach(act => {
        const actId = act._id || act.id || act.codigo;
        if (act.entradaLibre) {
            const div = document.createElement('div');
            div.className = 'checkboxActivity actividad-info';
            div.innerHTML = `
                <div class="box-visual"></div>
                <div class="info-actividad">
                    <span class="actividad-titulo">${act.nombre}</span>
                    <span class="actividad-fecha"><i class="bi bi-clock"></i> ${act.fecha} | ${act.horaInicio} - ${act.horaFin}</span>
                </div>
                <span class="actividad-tag tag-libre">Entrada Libre</span>
            `;
            container.appendChild(div);
        } else {
            const lleno = act.cupoOcupado >= act.cupoMaximo;
            const label = document.createElement('label');
            label.className = 'checkboxActivity' + (lleno ? ' actividad-deshabilitada' : '');
            label.innerHTML = `
                <input type="checkbox" name="actividades_seleccionadas" value="${actId}" data-hora="${act.horaInicio}" data-fecha="${act.fecha}" ${lleno ? 'disabled' : ''} />
                <div class="box-visual"></div>
                <div class="info-actividad">
                    <span class="actividad-titulo">${act.nombre}</span>
                    <span class="actividad-fecha"><i class="bi bi-clock"></i> ${act.fecha} | ${act.horaInicio} - ${act.horaFin}</span>
                </div>
                ${lleno ? '<span class="actividad-tag tag-lleno">Cupo lleno</span>' : '<span class="actividad-tag tag-disponible">' + act.cupoOcupado + '/' + act.cupoMaximo + ' cupos</span>'}
            `;
            container.appendChild(label);
        }
    });
};

// ── FILTROS DE ENTRADA ──────────────────────────────────────────────────

const inicializarFiltrosEntrada = () => {
    const cedulaInput = document.getElementById('cedulaVisitante');
    const telefonoInput = document.getElementById('telefonoVisitante');

    const bloquearLetras = (e) => {
        e.target.value = e.target.value.replace(/[^0-9]/g, '');
    };

    if (cedulaInput) cedulaInput.addEventListener('input', bloquearLetras);
    if (telefonoInput) telefonoInput.addEventListener('input', bloquearLetras);
};

// ── VALIDACIÓN E INSCRIPCIÓN ────────────────────────────────────────────

const validarInscripcion = async (e) => {
    e.preventDefault();
    limpiarErrores();
    let esValido = true;

    // Campos requeridos
    const camposRequeridos = [
        { id: 'nombreVisitante', mensaje: 'El nombre completo es requerido.' },
        { id: 'carreraVisitante', mensaje: 'La carrera o profesion es requerida.' }
    ];
    camposRequeridos.forEach(campo => {
        if (!validaciones.validarCampo(campo.id, validaciones.validarRequerido, campo.mensaje)) {
            esValido = false;
        }
    });

    const nombreInput = document.getElementById('nombreVisitante');
    if (nombreInput && validaciones.validarRequerido(nombreInput.value) && !validaciones.validarNombre(nombreInput.value)) {
        mostrarError('nombreVisitante', 'El nombre debe tener al menos 3 caracteres.');
        esValido = false;
    }

    const cedulaInput = document.getElementById('cedulaVisitante');
    if (cedulaInput) {
        if (!validaciones.validarRequerido(cedulaInput.value)) {
            mostrarError('cedulaVisitante', 'La cedula es requerida.');
            esValido = false;
        } else if (!validaciones.validarCedula(cedulaInput.value)) {
            mostrarError('cedulaVisitante', 'Ingrese una cedula valida (8-12 digitos).');
            esValido = false;
        }
    }

    const telefonoInput = document.getElementById('telefonoVisitante');
    if (telefonoInput) {
        if (!validaciones.validarRequerido(telefonoInput.value)) {
            mostrarError('telefonoVisitante', 'El telefono es requerido.');
            esValido = false;
        } else if (!validaciones.validarTelefono(telefonoInput.value)) {
            mostrarError('telefonoVisitante', 'Ingrese un telefono valido (8 digitos).');
            esValido = false;
        }
    }

    const emailInput = document.getElementById('emailVisitante');
    if (emailInput) {
        if (!validaciones.validarRequerido(emailInput.value)) {
            mostrarError('emailVisitante', 'El correo es requerido.');
            esValido = false;
        } else if (!validaciones.validarCorreo(emailInput.value)) {
            mostrarError('emailVisitante', 'Ingrese un correo valido.');
            esValido = false;
        }
    }

    const edadInput = document.getElementById('edadVisitante');
    if (edadInput) {
        if (!validaciones.validarRequerido(edadInput.value)) {
            mostrarError('edadVisitante', 'La edad es requerida.');
            esValido = false;
        } else if (!validaciones.validarEdad(edadInput.value)) {
            mostrarError('edadVisitante', 'Ingrese una edad valida (15-120).');
            esValido = false;
        }
    }

    // Actividades seleccionadas
    const checkboxes = document.querySelectorAll('input[name="actividades_seleccionadas"]:checked');
    const hayCheckboxesDisponibles = document.querySelectorAll('input[name="actividades_seleccionadas"]').length > 0;

    if (hayCheckboxesDisponibles && checkboxes.length === 0) {
        mostrarError('actividades', 'Debe seleccionar al menos una actividad.');
        esValido = false;
    } else if (hayCheckboxesDisponibles && checkboxes.length > 0) {
        const seleccionadas = Array.from(checkboxes).map(cb => {
            return { fecha: cb.dataset.fecha, horaInicio: cb.dataset.hora, nombre: '' };
        });
        const conflictos = validaciones.detectarConflictosHorario(seleccionadas);
        if (conflictos.length > 0) {
            mostrarError('actividades', 'Tiene un choque de horarios en las actividades seleccionadas.');
            esValido = false;
        }
    }

    // Enviar inscripción a la API
    if (esValido) {
        const actividadesSeleccionadas = Array.from(
            document.querySelectorAll('input[name="actividades_seleccionadas"]:checked')
        ).map(cb => cb.value);

        const datos = {
            nombreCompleto: document.getElementById('nombreVisitante').value.trim(),
            idDocumento: document.getElementById('cedulaVisitante').value.trim(),
            correo: document.getElementById('emailVisitante').value.trim(),
            telefono: document.getElementById('telefonoVisitante').value.trim(),
            edad: parseInt(document.getElementById('edadVisitante').value.trim()),
            carrera: document.getElementById('carreraVisitante').value.trim(),
            actividades: actividadesSeleccionadas
        };

        try {
            const resultado = await apiPost('inscripciones', datos);

            // Si el evento es de pago, redirigir a la página de pago
            const eventoActual = window._eventoActual;
            if (eventoActual && (eventoActual.tipoEntrada === 'pago' && !eventoActual.entradaLibre)) {
                const actNombres = actividadesSeleccionadas.join(',');
                window.location.href = `pago.html?actividades=${encodeURIComponent(actNombres)}&nombre=${encodeURIComponent(datos.nombreCompleto)}`;
            } else {
                validaciones.exito('Inscripción exitosa', 'Te has inscrito correctamente al evento.');
                document.getElementById('inscribirVisitante').reset();
            }
        } catch (error) {
            // apiPost ya muestra el error con SweetAlert2 (409 duplicado, 400 validación, etc.)
        }
    }
};

// ── INICIALIZADOR PRINCIPAL ─────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const eventoId = params.get('id');

    if (!eventoId) {
        document.querySelector('.eventTitle').textContent = 'Evento no encontrado';
        return;
    }

    try {
        // GET /api/eventos/:id devuelve evento + actividades + oradores + stands
        const respuesta = await apiGet(`eventos/${eventoId}`);
        const evento = respuesta.data || respuesta;

        if (!evento || !evento.nombre) {
            document.querySelector('.eventTitle').textContent = 'Evento no encontrado';
            return;
        }

        const actividades = evento.actividades || [];
        const oradores = evento.oradores || [];
        const stands = evento.stands || [];

        // Guardar referencia global al evento para la redirección a pago
        window._eventoActual = evento;

        renderizarEvento(evento);
        renderizarActividades(actividades);
        renderizarAgenda(eventoId);
        renderizarPresentadores(oradores);
        renderizarStands(stands);
        renderizarCheckboxesActividades(actividades);

    } catch (error) {
        console.error('Error cargando evento:', error);
        document.querySelector('.eventTitle').textContent = 'Error al cargar el evento';
    }

    // Inicializar navbar search dropdown
    if (validaciones && validaciones.inicializarNavbarSearch) {
        validaciones.inicializarNavbarSearch('');
    }

    // Inicializar formulario
    inicializarFiltrosEntrada();
    const formInscripcion = document.getElementById('inscribirVisitante');
    if (formInscripcion) {
        formInscripcion.addEventListener('submit', validarInscripcion);
    }
});
