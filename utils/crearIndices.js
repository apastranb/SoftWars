const { MongoClient } = require('mongodb');

async function crearIndices() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.DB_NAME || 'softwars_eventos';

  if (!uri) {
    throw new Error('Falta MONGODB_URI. Copie .env.example como .env y complete los valores.');
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('[db] Creando índices en MongoDB...');
    const db = client.db(dbName);

    await db.collection('usuarios').createIndex({ correo: 1 }, { unique: true, name: 'idx_usuarios_correo' });
    await db.collection('oradores').createIndex({ codigo: 1 }, { unique: true, name: 'idx_oradores_codigo' });
    await db.collection('oradores').createIndex({ correo: 1 }, { unique: true, name: 'idx_oradores_correo' });
    await db.collection('eventos').createIndex({ nombre: 'text', lugar: 'text', categoria: 'text' }, { name: 'idx_eventos_texto' });
    await db.collection('actividades').createIndex({ nombre: 'text', lugar: 'text', categoria: 'text' }, { name: 'idx_actividades_texto' });
    await db.collection('actividades').createIndex({ categoria: 1, estado: 1 }, { name: 'idx_actividades_categoria_estado' });
    await db.collection('stands').createIndex({ eventoId: 1, correo: 1 }, { unique: true, name: 'idx_stands_evento_correo' });
    await db.collection('stands').createIndex({ codigo: 1 }, { unique: true, name: 'idx_stands_codigo' });
    await db.collection('participantes').createIndex({ correo: 1, actividades: 1 }, { unique: true, name: 'idx_participantes_correo_actividades' });
    await db.collection('postulaciones').createIndex({ correo: 1, actividadId: 1 }, { unique: true, name: 'idx_postulaciones_correo_actividad' });
    await db.collection('contadores').createIndex({ _id: 1 }, { name: 'idx_contadores_id' });

    console.log('[db] Todos los índices fueron creados correctamente.');
  } catch (error) {
    console.error('[db] Error al crear los índices:', error.message);
    throw error;
  } finally {
    await client.close();
  }
}

module.exports = { crearIndices };