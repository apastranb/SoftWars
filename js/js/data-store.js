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
    sesionActual: null
};
