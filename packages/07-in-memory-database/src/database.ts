type Document = { _id: any } & Record<string, any>;

class Database {
  collections: Record<string, Document[]>;

  constructor(collections: Record<string, Document[]> = {}) {
    this.collections = collections;
  }

  listCollections() {
    return Object.keys(this.collections).map(name => ({ name }))
  }
}

const databases: Record<string, Database> = {
  admin: new Database(),
  config: new Database(),
  local: new Database({ startup_log: [] }),
};

export function getDatabase(name: string): Database {
  let db = databases[name];
  if (!databases[name]) {
    db = new Database();
    databases[name] = db
  };
  
  return db!;
}

export function listDatabases() {
  return Object.keys(databases).map(name => ({ name }));
}