import fs from 'fs';
import path from 'path';

import sqlite3 from 'sqlite3';

const dir = path.dirname(import.meta.url.slice(6));

if (!fs.existsSync('./Data'))
	fs.mkdirSync('./Data');

const db = new (sqlite3.verbose().Database)('./Data/Users');

db.serialize(function() {
    db.exec(fs.readFileSync('./bin/init.sql').toString());
});
