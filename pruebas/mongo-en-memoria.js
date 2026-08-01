// Doble en memoria del subconjunto del driver de MongoDB que usan los
// controllers. Sirve para ejercitar la lógica de negocio sin un mongod real.
// NO sustituye a las pruebas contra Atlas.
const { ObjectId } = require('mongodb');

const igual = (a, b) => {
    if (a instanceof ObjectId || b instanceof ObjectId) return String(a) === String(b);
    if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime();
    return a === b;
};

function coincideCondicion(valor, cond) {
    if (cond && typeof cond === 'object' && !(cond instanceof ObjectId) && !(cond instanceof Date) && !Array.isArray(cond)) {
        const claves = Object.keys(cond);
        if (claves.some(k => k.startsWith('$'))) {
            return claves.every(op => {
                switch (op) {
                    case '$in':  return cond.$in.some(x => igual(valor, x));
                    case '$nin': return !cond.$nin.some(x => igual(valor, x));
                    case '$ne':  return !igual(valor, cond.$ne);
                    case '$regex': {
                        const re = new RegExp(cond.$regex, cond.$options || '');
                        return typeof valor === 'string' && re.test(valor);
                    }
                    case '$options': return true;
                    case '$exists': return (valor !== undefined) === cond.$exists;
                    default: throw new Error(`Operador no soportado por el doble: ${op}`);
                }
            });
        }
    }
    return igual(valor, cond);
}

function coincide(doc, filtro = {}) {
    return Object.entries(filtro).every(([clave, cond]) => {
        if (clave === '$or')  return cond.some(f => coincide(doc, f));
        if (clave === '$and') return cond.every(f => coincide(doc, f));
        return coincideCondicion(doc[clave], cond);
    });
}

function aplicar(doc, update) {
    if (update.$set)  Object.assign(doc, update.$set);
    if (update.$inc)  for (const [k, n] of Object.entries(update.$inc)) doc[k] = (doc[k] || 0) + n;
    return doc;
}

class Coleccion {
    constructor() { this.docs = []; }

    async insertOne(doc) {
        const nuevo = { _id: doc._id !== undefined ? doc._id : new ObjectId(), ...doc };
        this.docs.push(nuevo);
        return { insertedId: nuevo._id, acknowledged: true };
    }
    async findOne(filtro = {}) {
        const d = this.docs.find(x => coincide(x, filtro));
        return d ? { ...d } : null;
    }
    find(filtro = {}) {
        let resultado = this.docs.filter(x => coincide(x, filtro)).map(x => ({ ...x }));
        const cursor = {
            sort(spec) {
                const entradas = Object.entries(spec);
                resultado.sort((a, b) => {
                    for (const [campo, dir] of entradas) {
                        const va = a[campo], vb = b[campo];
                        if (va === vb) continue;
                        if (va === undefined) return 1;
                        if (vb === undefined) return -1;
                        return (va > vb ? 1 : -1) * dir;
                    }
                    return 0;
                });
                return cursor;
            },
            async toArray() { return resultado; },
            [Symbol.asyncIterator]() {
                let i = 0;
                return { next: async () => i < resultado.length ? { value: resultado[i++], done: false } : { value: undefined, done: true } };
            }
        };
        return cursor;
    }
    async updateOne(filtro, update, opciones = {}) {
        const indice = this.docs.findIndex(x => coincide(x, filtro));
        if (indice >= 0) {
            aplicar(this.docs[indice], update);
            return { matchedCount: 1, modifiedCount: 1 };
        }
        if (opciones.upsert) {
            const base = {};
            for (const [k, v] of Object.entries(filtro)) if (!k.startsWith('$') && typeof v !== 'object') base[k] = v;
            if (filtro._id !== undefined) base._id = filtro._id;
            const nuevo = { ...base, ...(update.$setOnInsert || {}) };
            aplicar(nuevo, update);
            if (nuevo._id === undefined) nuevo._id = new ObjectId();
            this.docs.push(nuevo);
            return { matchedCount: 0, upsertedCount: 1, upsertedId: nuevo._id };
        }
        return { matchedCount: 0, modifiedCount: 0 };
    }
    async updateMany(filtro, update) {
        let n = 0;
        this.docs.forEach(d => { if (coincide(d, filtro)) { aplicar(d, update); n++; } });
        return { matchedCount: n, modifiedCount: n };
    }
    async findOneAndUpdate(filtro, update, opciones = {}) {
        await this.updateOne(filtro, update, opciones);
        const d = this.docs.find(x => coincide(x, filtro));
        return d ? { ...d } : null;
    }
    async deleteOne(filtro) {
        const i = this.docs.findIndex(x => coincide(x, filtro));
        if (i < 0) return { deletedCount: 0 };
        this.docs.splice(i, 1);
        return { deletedCount: 1 };
    }
    async countDocuments(filtro = {}) {
        return this.docs.filter(x => coincide(x, filtro)).length;
    }
    async distinct(campo, filtro = {}) {
        const vistos = new Map();
        this.docs.filter(x => coincide(x, filtro)).forEach(d => {
            if (d[campo] !== undefined && d[campo] !== null) vistos.set(String(d[campo]), d[campo]);
        });
        return [...vistos.values()];
    }
}

class BaseDatos {
    constructor() { this.colecciones = new Map(); }
    collection(nombre) {
        if (!this.colecciones.has(nombre)) this.colecciones.set(nombre, new Coleccion());
        return this.colecciones.get(nombre);
    }
}

module.exports = { BaseDatos };
