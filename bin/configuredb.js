import fs from 'fs';
import sqlite3 from 'sqlite3';

const db = new (sqlite3.verbose().Database)('./Data/Users');

db.serialize(function() {
    db.run(fs.readFileSync('./init.sql').toString());
})