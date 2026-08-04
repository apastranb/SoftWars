import { MongoClient } from 'mongodb';


const uri = process.env.MONGODB_URI || 'mongodb://localhost:3000';
const dbName = 'gestionEventos'; 

async function crearIndices() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Conectado exitosamente a MongoDB para crear índices.');
    const db = client.db(dbName);

    // 1. Usuarios: Único por correo
    await db.collection('usuarios').createIndex({ correo: 1 }, { unique: true });

    // 2. Oradores: Único por código
    await db.collection('oradores').createIndex({ codigo: 1 }, { unique: true });

    // 3. Actividades: Búsqueda de texto por nombre y lugar (Corregido 'titulo' -> 'nombre')
    await db.collection('actividades').createIndex({ nombre: 'text', lugar: 'text' });

    // 4. Actividades: Búsqueda por categoría y estado
    await db.collection('actividades').createIndex({ categoria: 1, estado: 1 });

    // 5. Stands: Búsqueda por ubicación y estado
    await db.collection('stands').createIndex({ ubicacion: 1, estado: 1 });

    // 6. Participantes: Único por correo y actividad (Corregido 'eventoId' -> 'actividades' segun RF-25)
    await db.collection('participantes').createIndex({ correo: 1, actividades: 1 }, { unique: true });

    // 7. Postulaciones: Único por correo y actividadId
    await db.collection('postulaciones').createIndex({ correo: 1, actividadId: 1 }, { unique: true });

    console.log('Todos los índices fueron creados correctamente.');
  } catch (error) {
    console.error('Error al crear los índices:', error);
  } finally {
    await client.close();
  }
}

crearIndices();