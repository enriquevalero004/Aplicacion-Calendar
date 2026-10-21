// Almacenamiento local con IndexedDB (aguanta fotos mucho mejor que localStorage).
// Tablas: events (planes), subjects (asignaturas) y tasks (exámenes, trabajos, entregas…).
const DB = (() => {
  const NAME = 'mi-calendario';
  const STORES = ['events', 'subjects', 'tasks'];
  let dbPromise;

  function open() {
    if (!dbPromise) {
      dbPromise = new Promise((resolve, reject) => {
        const req = indexedDB.open(NAME, 2);
        req.onupgradeneeded = () => {
          const db = req.result;
          for (const name of STORES) {
            if (!db.objectStoreNames.contains(name)) db.createObjectStore(name, { keyPath: 'id' });
          }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    }
    return dbPromise;
  }

  async function tx(store, mode, fn) {
    const db = await open();
    return new Promise((resolve, reject) => {
      const t = db.transaction(store, mode);
      const result = fn(t.objectStore(store));
      t.oncomplete = () => resolve(result && 'result' in result ? result.result : result);
      t.onerror = () => reject(t.error);
    });
  }

  const table = (store) => ({
    all: () => tx(store, 'readonly', (s) => s.getAll()),
    put: (item) => tx(store, 'readwrite', (s) => s.put(item)),
    remove: (id) => tx(store, 'readwrite', (s) => s.delete(id)),
  });

  return { events: table('events'), subjects: table('subjects'), tasks: table('tasks') };
})();
