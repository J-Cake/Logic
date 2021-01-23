import fs from 'fs';
import path from 'path';

import sqlite3 from 'sqlite3';

const dir = path.dirname(import.meta.url.slice(6));

const db = new (sqlite3.verbose().Database)('./Data/Users');

db.serialize(function() {
    db.run(fs.readFileSync(path.join(dir, './init.sql')).toString());
})
