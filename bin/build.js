import path from 'path';
import fs from 'fs';
import build from 'esbuild';

import {copy, rootFn} from "./build_utils.js";

const dirs = {
    root: rootFn(import.meta.url),
}

const devMode = !!process.argv.find(i => i.trim() === '--dev');

if (devMode)
    console.log("--- DEV MODE ---");

dirs.app = path.join(dirs.root, 'app');
dirs.build = path.join(dirs.root, 'build');
dirs.tsOutput = path.join(dirs.build, 'app');
dirs.finalOutput = path.join(dirs.build, 'final');

const buildComponent = (app, out, platform = 'browser') => build.build({
    entryPoints: [path.join(dirs.tsOutput, app)],
    outfile: path.join(dirs.finalOutput, out),
    loader: {'.js': 'js'},
    platform: platform,
    format: 'iife',
    bundle: true,
    minify: !devMode,
    sourcemap: devMode,
    target: 'es6',
    logLevel: process.argv.includes('--err') ? 'error' : 'silent'
})

const components = {
    app: () => buildComponent('src/index.js', 'app.js'),
    find: () => buildComponent('window/find.js', 'find.js'),
    dashboard: () => buildComponent('window/dashboard.js', 'dashboard.js'),
    componentMenu: () => buildComponent('window/components.js', 'comps.js'),
    collaborators: () => buildComponent('window/collaborators.js', 'collabs.js'),
}

if (!process.argv.find(i => i.trim() === '--static')) {
    const comps = process.argv.find(i => /^--components=.+$/.test(i));
    for (const i of comps ? comps.split('=').pop().split(',') : Object.keys(components)) {
        const start = new Date();
        components[i]()
            .then(() => console.log(`${i} - Done in ${new Date(new Date().getTime() - start.getTime()).getSeconds()}s`))
            .catch(async function (err) {
                console.error(`${i} - Failed with ${err.errors.length}`);
                fs.writeFile(path.join(await rootFn(), 'errs.json'), JSON.stringify(err, null, 4), () => process.exit(-1));
            });
    }
}

copy(path.join(dirs.app, 'static'), dirs.finalOutput);
fs.copyFileSync(path.join(dirs.root, 'package.json'), path.join(dirs.finalOutput, 'package.json'));
