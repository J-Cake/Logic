import path from 'path';
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

const components = {
    app: () => build.build({
        entryPoints: [path.join(dirs.tsOutput, 'src/index.js')],
        outfile: path.join(dirs.finalOutput, 'app.js'),
        loader: {
            '.js': 'js'
        },
        format: 'iife',
        bundle: true,
        minify: !devMode,
        sourcemap: devMode,
        target: 'es6'
    }),
    componentMenu: () => build.build({
        entryPoints: [path.join(dirs.tsOutput, 'prompt/componentMenu/index.js')],
        outfile: path.join(dirs.finalOutput, 'comps.js'),
        loader: {
            '.js': 'js'
        },
        format: 'iife',
        bundle: true,
        minify: !devMode,
        sourcemap: devMode,
        target: 'es6'
    }),
    find: () => build.build({
        entryPoints: [path.join(dirs.tsOutput, 'prompt/findComponents/index.js')],
        outfile: path.join(dirs.finalOutput, 'find.js'),
        loader: {
            '.js': 'js'
        },
        format: 'iife',
        bundle: true,
        minify: !devMode,
        sourcemap: devMode,
        target: 'es6'
    }),
    server: () => build.build({
        entryPoints: [path.join(dirs.tsOutput, 'server/HTTP/index.js')],
        outfile: path.join(dirs.finalOutput, 'server.js'),
        loader: {
            '.js': 'js'
        },
        platform: 'node',
        bundle: true,
        minify: !devMode,
        sourcemap: devMode,
        target: 'es6'
    })
}

if (!process.argv.find(i => i.trim() === '--static')) {
    const comps = process.argv.find(i => /^--components=.+$/.test(i));
    for (const i of comps ? comps.split('=').pop().split(',') : Object.keys(components)) {
        const start = new Date();
        components[i]().then(() => console.log(`${i} - Done in ${new Date(new Date().getTime() - start.getTime()).getSeconds()}s`));
    }
}

copy(path.join(dirs.app, 'static'), dirs.finalOutput);