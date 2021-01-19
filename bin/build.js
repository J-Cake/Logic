import fs from "fs";
import path from "path";
import childProcess from "child_process";
import browserify from "browserify";

const awaitProc = cli => new Promise(function (resolve, reject) {
    const proc = childProcess.exec(cli);

    proc.stdout.on("data", function (data) {
        process.stdout.write(data.split("\n").map(i => `\t${i}`).join("\n"));
    });

    proc.stderr.on("data", function (data) {
        process.stderr.write(data.split("\n").map(i => `\t${i}`).join("\n"));
    });

    proc.on('exit', function (code) {
        if (code === 0)
            resolve();
        else
            reject(code);
    });
});

const copy = function (loc, dest) {
    if (fs.existsSync(loc)) {
        if (fs.lstatSync(loc).isDirectory()) {
            const items = fs.readdirSync(loc);

            if (!fs.existsSync(dest))
                fs.mkdirSync(dest, {recursive: true});

            for (const item of items) {
                if (fs.lstatSync(path.join(loc, item)).isDirectory())
                    copy(path.join(loc, item), dest);
                else
                    fs.copyFileSync(path.join(loc, item), path.join(dest, item));
            }
        } else
            fs.copyFileSync(path.join(loc, item), dest);
    } else
        throw new Error("The item does not exist");
}

copy("./app/static", "./build/final");

if (process.argv.includes("--ts"))
    await awaitProc("npx tsc");

const components = {
    app: () => browserify({
        entries: ["./build/app/src/index.js"],
        debug: process.argv.includes('--debug')
    }).bundle().pipe(fs.createWriteStream('./build/final/app.js')),
    comps: () => browserify({
        entries: ['./build/app/componentMenu/index.js'],
        debug: process.argv.includes('--debug')
    }).bundle().pipe(fs.createWriteStream('./build/final/comps.js'))
}

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
