import path from 'path';
import fs from 'fs';
import url from 'url'
import build from 'esbuild';

import {copy, find, dirs} from "./build_utils.js";

const devMode = !!process.argv.find(i => i.trim() === '--dev');

if (devMode)
    console.log("--- Building in dev mode ---");

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

if (process.argv.includes('--clean'))
    fs.readdirSync(dirs.build)
        .map(i => path.join(dirs.build, i))
        .forEach(i => fs.rmdirSync(i, {recursive: true}));

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
                fs.writeFile(path.join(find(url.fileURLToPath(import.meta.url), 'package.json'), 'errs.json'), JSON.stringify(err, null, 4), () => process.exit(-1));
            });
    }
}

copy(path.join(dirs.app, 'static/app'), dirs.finalOutput);
fs.copyFileSync(path.join(dirs.root, 'package.json'), path.join(dirs.finalOutput, 'package.json'));
