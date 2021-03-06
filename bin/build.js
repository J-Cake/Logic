import fs from "fs";
import browserify from "browserify";

import {copy, awaitProc} from "./build_utils.js";

const components = {
    app: () => browserify({
        entries: ["./build/app/src/index.js"],
        debug: process.argv.includes('--debug')
    }).bundle().pipe(fs.createWriteStream('./build/final/app.js')),
    comps: () => browserify({
        entries: ['./build/app/componentMenu/index.js'],
        debug: process.argv.includes('--debug')
    }).bundle().pipe(fs.createWriteStream('./build/final/comps.js')),
    server: () => browserify({
        entries: ['./build/app/server/HTTP/index.js'],
        debug: process.argv.includes('--debug'),
        bare: true,
        browserField: false
    }).bundle().pipe(fs.createWriteStream('./build/final/server.js'))
}

if (!process.argv.includes('--no-build')) {

    copy("./app/static", "./build/final");

    if (process.argv.includes("--ts"))
        await awaitProc("npx tsc");

    const wrap = cb => {
        try {
            return cb();
        } catch (err) {
            throw new Error(err.message);
        }
    }

    if (!process.argv.includes('--static')) {
        const regex = /^--components=(.[^,]+)(?:,(.[^,]+))*$/;
        const componentsToBuild = process.argv.find(i => regex.test(i));
        if (componentsToBuild) {
            const names = componentsToBuild.match(regex).slice(1).filter(i => i);
            console.log(names);
            for (const i of names)
                if (i in components) {
                    new Promise(function (resolve) {
                        console.log("Building", i);
                        resolve(wrap(components[i]));
                    }).then(_ => console.log("Done", i));
                }
        } else
            for (const i in components)
                new Promise(res => res(wrap(components[i]))).then(() => console.log('Done', i));
    }
} else {
    console.log('Skipping Static Files');
    console.log('Skipping TypeScript Build');
    for (const i in components)
        console.log(`Skipping component ${i}`);
}