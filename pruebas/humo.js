// Pruebas de humo de las APIs de Josué (SW-12, SW-14, SW-17)
const { BaseDatos } = require('./mongo-en-memoria');

let fallos = 0, pasos = 0;
function check(nombre, condicion, detalle='') {
    if (condicion) { pasos++; console.log(`  ✓ ${nombre}`); }
    else { fallos++; console.log(`  ✗ ${nombre}  ${detalle}`); }
}

(async () => {
    // Se inyecta el doble ANTES de requerir server.js, para que los
    // controllers capturen esta versión de getDB() al cargarse.
    const db = new BaseDatos();
    const moduloDB = require('../config/db');
    moduloDB.getDB = () => db;

    // --- Datos previos que normalmente vienen del seed de Adonis (SW-8) ---
    const ev = await db.collection('eventos').insertOne({
        codigo: 'EV-001', nombre: 'Seminario de IA', visibilidad: 'publico', estado: 'Disponible'
    });
    const eventoId = ev.insertedId;

    // Orador preexistente con código OR-005 para probar la siembra del contador
    await db.collection('oradores').insertOne({
        codigo: 'OR-005', nombre: 'Laura Vindas', correo: 'laura.vindas@cloudcr.cr',
        telefonos: ['8888-0005'], telefono: '8888-0005', especialidad: 'Cloud',
        empresa: 'CloudSystems', biografia: 'Arquitecta cloud.', foto: null,
        eventoId, estado: 'Inactivo', fechaRegistro: new Date()
    });

    const request = require('supertest');
    const app = require('../server');
    const api = request(app);

    // =====================================================================
    console.log('\n== SW-12 · API de oradores ==');

    let r = await api.post('/api/oradores').send({
        nombre: 'Ana Rodríguez', correo: 'ANA.Rodriguez@techcorp.cr',
        telefono: '88880001', telefono2: '8888-9999',
        especialidad: 'Ingeniería de Software', empresa: 'Tech Corp',
        biografia: 'Especialista en arquitectura de software.', eventoId: String(eventoId)
    });
    check('POST crea el orador (201)', r.status === 201, `status=${r.status} ${JSON.stringify(r.body)}`);
    check('Código continúa desde OR-005 → OR-006', r.body.codigo === 'OR-006', `codigo=${r.body.codigo}`);
    check('Correo normalizado a minúsculas', r.body.correo === 'ana.rodriguez@techcorp.cr', r.body.correo);
    check('Teléfonos normalizados a 0000-0000', JSON.stringify(r.body.telefonos) === '["8888-0001","8888-9999"]', JSON.stringify(r.body.telefonos));
    check('Estado por defecto = Activo', r.body.estado === 'Activo', r.body.estado);
    const oradorId = r.body._id;

    r = await api.post('/api/oradores').send({
        nombre: 'Otra Persona', correo: 'ana.rodriguez@techcorp.cr', telefono: '88881111',
        especialidad: 'IA', empresa: 'X', biografia: 'bio'
    });
    check('Correo duplicado → 409', r.status === 409, `status=${r.status}`);

    r = await api.post('/api/oradores').send({ nombre: 'Ab', correo: 'malo', telefono: '123' });
    check('Datos inválidos → 400', r.status === 400, `status=${r.status}`);
    check('400 detalla los campos', r.body.error === true && typeof r.body.mensaje === 'string', JSON.stringify(r.body));

    r = await api.get('/api/oradores');
    check('GET lista los 2 oradores', Array.isArray(r.body) && r.body.length === 2, `n=${r.body.length}`);
    check('Lista incluye puedeEditarse', r.body[0].puedeEditarse === true, JSON.stringify(r.body[0].puedeEditarse));

    r = await api.get('/api/oradores?q=rodriguez');
    check('Búsqueda por texto (RF-20)', r.body.length === 1 && r.body[0].nombre === 'Ana Rodríguez', `n=${r.body.length}`);

    r = await api.get('/api/oradores?estado=activo');
    check('Filtro por estado ignora mayúsculas', r.body.length === 1, `n=${r.body.length}`);

    r = await api.get('/api/oradores/OR-006');
    check('GET por código legible', r.status === 200 && r.body.codigo === 'OR-006', `status=${r.status}`);

    // --- RF-13: eliminación condicional ---
    r = await api.put(`/api/oradores/${oradorId}`).send({ especialidad: 'Arquitectura de Software' });
    check('PUT sin actividades activas → 200', r.status === 200, `status=${r.status}`);
    check('PUT conserva los teléfonos', JSON.stringify(r.body.telefonos) === '["8888-0001","8888-9999"]', JSON.stringify(r.body.telefonos));

    const { ObjectId } = require('mongodb');
    await db.collection('actividades').insertOne({
        codigo: 'ACT-001', nombre: 'Taller de Prompt Engineering', eventoId,
        responsableId: new ObjectId(oradorId), estado: 'Disponible'
    });

    r = await api.put(`/api/oradores/${oradorId}`).send({ nombre: 'Ana R. Mora' });
    check('RF-13 · PUT con actividad activa → 409', r.status === 409, `status=${r.status}`);
    r = await api.delete(`/api/oradores/${oradorId}`);
    check('RF-13 · DELETE con actividad activa → 409', r.status === 409, `status=${r.status}`);
    check('409 informa cuántas actividades', /1 actividad/.test(r.body.mensaje || ''), r.body.mensaje);

    r = await api.patch(`/api/oradores/${oradorId}/estado`).send({ estado: 'Inactivo' });
    check('PATCH estado sí permitido con actividad activa', r.status === 200 && r.body.estado === 'Inactivo', `status=${r.status}`);

    r = await api.get('/api/oradores');
    const conActividad = r.body.find(o => o._id === oradorId);
    check('Lista marca tieneActividadesActivas', conActividad.tieneActividadesActivas === true);

    await db.collection('actividades').updateOne({ codigo: 'ACT-001' }, { $set: { estado: 'Cancelada' } });
    r = await api.delete(`/api/oradores/${oradorId}`);
    check('DELETE tras cancelar la actividad → 200', r.status === 200, `status=${r.status}`);
    const act = await db.collection('actividades').findOne({ codigo: 'ACT-001' });
    check('Se limpia responsableId huérfano', act.responsableId === null);

    // =====================================================================
    console.log('\n== SW-14 · API de stands ==');

    const anio = new Date().getFullYear();
    r = await api.post('/api/stands').send({
        eventoId: String(eventoId), nombre: 'Tech Corp', categoria: 'empresa',
        descripcion: 'Soluciones empresariales de software.', encargado: 'Juan Pérez',
        empresa: 'Tech Corp', correo: 'juan@techcorp.cr', telefono: '88881001'
    });
    check('POST crea el stand (201)', r.status === 201, `status=${r.status} ${JSON.stringify(r.body)}`);
    check(`RF-15 · numero = 1 y codigo = S-${anio}-001`, r.body.numero === 1 && r.body.codigo === `S-${anio}-001`, r.body.codigo);
    check('RF-15 · guarda el año', r.body.anio === anio, String(r.body.anio));
    check('RF-15 · estado por defecto Aprobado', r.body.estado === 'Aprobado', r.body.estado);
    const standId = r.body._id;

    r = await api.post('/api/stands').send({
        eventoId: String(eventoId), nombre: 'AI Solutions', categoria: 'empresa',
        descripcion: 'IA aplicada a negocios.', encargado: 'Carlos Mora',
        empresa: 'AI Solutions', correo: 'carlos@aisol.cr', telefono: '88881002'
    });
    check('RF-15 · el consecutivo avanza a 002', r.body.codigo === `S-${anio}-002`, r.body.codigo);

    // Reinicio anual: se simula un stand del año anterior
    await db.collection('stands').insertOne({ codigo: `S-${anio-1}-047`, numero: 47, anio: anio-1, nombre: 'Viejo', estado: 'Cerrado' });
    r = await api.post('/api/stands').send({
        eventoId: String(eventoId), nombre: 'SecureNet', categoria: 'empresa',
        descripcion: 'Ciberseguridad.', encargado: 'María López',
        empresa: 'SecureNet', correo: 'maria@securenet.cr', telefono: '88881003'
    });
    check('RF-15 · el nº del año anterior no afecta al actual', r.body.codigo === `S-${anio}-003`, r.body.codigo);

    r = await api.post('/api/stands').send({
        eventoId: String(eventoId), nombre: 'Repetido', categoria: 'personal',
        descripcion: 'x', encargado: 'Juan Pérez', empresa: 'Tech Corp',
        correo: 'juan@techcorp.cr', telefono: '88881009'
    });
    check('Correo repetido en el mismo evento → 409', r.status === 409, `status=${r.status}`);

    r = await api.post('/api/stands').send({
        eventoId: String(eventoId), nombre: 'Sin categoría', categoria: 'gubernamental',
        descripcion: 'x', encargado: 'A B', empresa: 'Y', correo: 'z@z.cr', telefono: '88881010'
    });
    check('RF-14 · categoría fuera de catálogo → 400', r.status === 400, `status=${r.status}`);

    r = await api.put(`/api/stands/${standId}`).send({ correo: 'otro@techcorp.cr' });
    check('RF-16 · cambiar el correo → 400', r.status === 400, `status=${r.status}`);
    check('RF-16 · el mensaje cita el requerimiento', /RF-16/.test(r.body.mensaje || ''), r.body.mensaje);

    r = await api.put(`/api/stands/${standId}`).send({ numero: 99 });
    check('RF-16 · cambiar el ID numérico → 400', r.status === 400, `status=${r.status}`);

    r = await api.put(`/api/stands/${standId}`).send({ nombre: 'Tech Corp CR', descripcion: 'Actualizada.' });
    check('RF-16 · el resto de campos sí se edita', r.status === 200 && r.body.nombre === 'Tech Corp CR', `status=${r.status}`);
    check('RF-16 · el código no cambió', r.body.codigo === `S-${anio}-001`, r.body.codigo);

    r = await api.patch(`/api/stands/${standId}/estado`).send({ estado: 'cerrado' });
    check('PATCH estado normaliza a Cerrado', r.status === 200 && r.body.estado === 'Cerrado', r.body.estado);

    r = await api.get('/api/stands?q=securenet');
    check('RF-22 · búsqueda por nombre', r.body.length === 1, `n=${r.body.length}`);
    r = await api.get('/api/stands?encargado=Juan');
    check('RF-22 · filtro por responsable', r.body.length === 1, `n=${r.body.length}`);
    r = await api.get('/api/stands?estado=Cerrado');
    check('RF-22 · filtro por estado', r.body.length === 2, `n=${r.body.length}`);

    // =====================================================================
    console.log('\n== SW-17 · API de postulaciones ==');

    const actA = await db.collection('actividades').insertOne({ codigo: 'ACT-010', nombre: 'Charla A', eventoId, estado: 'Disponible' });
    const actB = await db.collection('actividades').insertOne({ codigo: 'ACT-011', nombre: 'Charla B', eventoId, estado: 'Disponible' });

    const postulante = {
        nombre: 'Mario Solís', correo: 'mario.solis@gmail.com', telefono: '88993344',
        especialidad: 'Desarrollo Móvil', organizacion: 'Independiente',
        biografia: 'Desarrollador Android con 6 años de experiencia.'
    };

    r = await api.post('/api/postulaciones').send({ ...postulante, actividadId: String(actA.insertedId) });
    check('RF-24 · POST público crea la postulación (201)', r.status === 201, `status=${r.status} ${JSON.stringify(r.body)}`);
    check('Código PT-001', r.body.codigo === 'PT-001', r.body.codigo);
    check('Estado inicial Pendiente', r.body.estado === 'Pendiente', r.body.estado);
    check('eventoId derivado de la actividad', String(r.body.eventoId) === String(eventoId));
    const postId = r.body._id;

    r = await api.post('/api/postulaciones').send({ ...postulante, actividadId: String(actA.insertedId) });
    check('RF-25 · mismo correo, misma actividad → 409', r.status === 409, `status=${r.status}`);

    r = await api.post('/api/postulaciones').send({ ...postulante, actividadId: String(actB.insertedId) });
    check('RF-25 · mismo correo, OTRA actividad → 201', r.status === 201, `status=${r.status}`);
    const postIdB = r.body._id;

    r = await api.post('/api/postulaciones').send({ ...postulante, actividadId: String(new ObjectId()) });
    check('Actividad inexistente → 400', r.status === 400, `status=${r.status}`);

    r = await api.post('/api/postulaciones').send({ nombre: 'X', correo: 'no-es-correo' });
    check('Datos inválidos → 400', r.status === 400, `status=${r.status}`);

    r = await api.patch(`/api/postulaciones/${postId}/aprobar`).send({});
    check('HU-10 · aprobar → 200', r.status === 200, `status=${r.status} ${JSON.stringify(r.body)}`);
    check('HU-10 · se creó el orador', r.body.oradorCreado === true && r.body.orador.codigo === 'OR-007', JSON.stringify(r.body.orador && r.body.orador.codigo));
    check('El orador nuevo queda Activo', r.body.orador.estado === 'Activo', r.body.orador.estado);

    r = await api.patch(`/api/postulaciones/${postId}/aprobar`).send({});
    check('Aprobar dos veces → 409', r.status === 409, `status=${r.status}`);

    r = await api.patch(`/api/postulaciones/${postIdB}/aprobar`).send({});
    check('Aprobar 2ª postulación reutiliza el orador existente', r.status === 200 && r.body.oradorCreado === false, JSON.stringify(r.body.oradorCreado));
    const totalOradores = await db.collection('oradores').countDocuments({ correo: 'mario.solis@gmail.com' });
    check('No se duplicó el orador', totalOradores === 1, `n=${totalOradores}`);

    r = await api.post('/api/postulaciones').send({ ...postulante, correo: 'otra@gmail.com', actividadId: 'ACT-010' });
    const postIdC = r.body._id;
    r = await api.patch(`/api/postulaciones/${postIdC}/rechazar`).send({ motivo: 'Tema fuera del alcance del evento.' });
    check('HU-10 · rechazar → 200', r.status === 200, `status=${r.status}`);
    check('Guarda el motivo del rechazo', r.body.postulacion.motivoRechazo === 'Tema fuera del alcance del evento.', r.body.postulacion.motivoRechazo);

    r = await api.get('/api/postulaciones?estado=Aprobada');
    check('Filtro por estado en la bandeja', r.body.length === 2, `n=${r.body.length}`);

    // =====================================================================
    console.log(`\n${pasos} pruebas correctas, ${fallos} fallidas.`);
    process.exit(fallos > 0 ? 1 : 0);
})().catch(e => { console.error('ERROR FATAL:', e); process.exit(1); });
