import fs from 'fs';
import path from 'path';
import os from "os";
import url from 'url'

import sqlite3 from 'sqlite3';

const dir = path.dirname(url.fileURLToPath(import.meta.url));

const dirMatcher = /^--db-dir=([.~]?.[^\/]+)+$/;

let dbDir = process.argv.find(i => dirMatcher.test(i))?.match(dirMatcher)?.[0]?.split('=')?.pop() || './data/LogicX/users.db';

if (dbDir.startsWith('~/'))
	dbDir = path.join(os.homedir(), dbDir.slice(2));

if (!fs.existsSync(path.dirname(dbDir)))
	fs.mkdirSync(path.dirname(dbDir), {recursive: true});

const db = new (sqlite3.verbose().Database)(dbDir);

db.serialize(function() {
    db.exec(fs.readFileSync(path.join(dir, 'init.sql')).toString());
});
