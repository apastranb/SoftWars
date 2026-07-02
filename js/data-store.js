// Base de datos simulada en memoria
window.db = window.db || {
    usuarios: [
        { id: "U-001", nombre: "Admin Principal", email: "admin@ucenfotec.ac.cr", password: "T3st.Pswrd!", rol: "Super Administrador", estado: "Activo", fechaCreacion: "2026-06-01" },
        { id: "U-002", nombre: "Gestor Eventos", email: "gestor@ucenfotec.ac.cr", password: "G3st.Pswrd!", rol: "Editor", estado: "Inactivo", fechaCreacion: "2026-06-05" }
    ],
    responsables: [
        { id: "R-001", nombre: "Juan Pérez", correo: "jperez@test.com", telefonos: "8888-8888", especialidad: "DevOps", empresa: "TechCorp", estado: "Aprobado" },
        { id: "R-002", nombre: "María Gómez", correo: "mgomez@test.com", telefonos: "7777-7777", especialidad: "IA", empresa: "Independiente", estado: "Pendiente" }
    ],
    // Catálogo de roles disponibles para asignar a los usuarios (HU-08)
    roles: ["Super Administrador", "Administrador", "Editor", "Moderador"],

    // Eventos: cada uno tiene un responsable a cargo (por correo, referencia a "responsables")
    eventos: [
        { id: "EV-001", nombre: "Seminario de Inteligencia Artificial", responsableCorreo: "mgomez@test.com" },
        { id: "EV-002", nombre: "Torneo Deportivo Interuniversitario", responsableCorreo: "jperez@test.com" }
    ],

    // Actividades ligadas a un evento. requiereInscripcion=false => no necesita registro previo.
    actividades: [
        { id: "ACT-001", eventoId: "EV-001", nombre: "Taller: Prompt Engineering Avanzado", categoria: "Tecnológica", fecha: "2026-11-15", hora: "02:00 PM", lugar: "Auditorio Principal", cupoMaximo: 40, cupoActual: 12, requiereInscripcion: true },
        { id: "ACT-002", eventoId: "EV-001", nombre: "Panel: Ética en IA", categoria: "Tecnológica", fecha: "2026-11-16", hora: "10:00 AM", lugar: "Sala Magna", cupoMaximo: 60, cupoActual: 60, requiereInscripcion: true },
        { id: "ACT-003", eventoId: "EV-001", nombre: "Feria de Stands Tecnológicos", categoria: "Tecnológica", fecha: "2026-11-16", hora: "09:00 AM", lugar: "Pasillo Central", cupoMaximo: 0, cupoActual: 0, requiereInscripcion: false },
        { id: "ACT-004", eventoId: "EV-002", nombre: "Partido de Fútbol Inaugural", categoria: "Deportiva", fecha: "2026-11-20", hora: "03:00 PM", lugar: "Cancha Principal", cupoMaximo: 200, cupoActual: 50, requiereInscripcion: true }
    ],

    // Participantes/asistentes inscritos a actividades (HU de Asistentes e Inscripciones)
    participantes: [
        {
            id: "P-001",
            idDocumento: "1-1111-1111",
            nombreCompleto: "Ana Solano",
            correo: "ana.solano@estudiante.cr",
            telefono: "8811-2233",
            edad: 21,
            carrera: "Ingeniería en Sistemas",
            actividades: ["ACT-001"],
            estado: "Activo",
            fechaInscripcion: "2026-06-20"
        },
        {
            id: "P-002",
            idDocumento: "2-2222-2222",
            nombreCompleto: "Luis Fernández",
            correo: "luis.fernandez@estudiante.cr",
            telefono: "8722-4455",
            edad: 24,
            carrera: "Administración de Empresas",
            actividades: ["ACT-004"],
            estado: "Activo",
            fechaInscripcion: "2026-06-22"
        }
    ],

    sesionActual: null
};
