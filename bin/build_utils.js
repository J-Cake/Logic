import fs from "fs";
import path from "path";
import childProcess from "child_process";
import url from "url";

export const awaitProc = cli => new Promise(function (resolve, reject) {
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

export const copy = function (loc, dest, flat = false) {
    const cp = function (loc, dest, flat, copyChain = []) {
        if (fs.existsSync(loc)) {
            if (!fs.existsSync(dest))
                fs.mkdirSync(dest, {recursive: true});

            if (fs.lstatSync(loc).isDirectory()) {
                const items = fs.readdirSync(loc);

                for (const item of items) {
                    if (fs.statSync(path.join(loc, item)).isDirectory())
                        cp(path.join(loc, item), flat ? dest : path.join(dest, ...copyChain.slice(1), item), flat, copyChain.concat(item));
                    else
                        fs.copyFileSync(path.join(loc, item), flat ? path.join(dest, item) : path.join(dest, ...copyChain.slice(1, -1), item));
                }
            } else
                fs.copyFileSync(loc, dest);
        } else
            throw {
                msg: `The item doesn't exist`,
                item: loc,
                destination: dest
            };
    }
    cp(loc, dest, flat, []);
}

export function find(dir, file) {
    if (!fs.statSync(dir).isDirectory())
        return find(path.dirname(dir), file);

    if (fs.readdirSync(dir).includes(file))
        return dir;
    else if (dir.split(path.sep).length >= 2)
        return find(path.dirname(dir), file);
    else
        return null;
}

export const root = find(url.fileURLToPath(import.meta.url), 'package.json');
const app = path.join(root, 'app'),
    build = path.join(root, 'build'),
    tsOutput = path.join(build, 'app'),
    finalOutput = path.join(build, 'final'),
    res = path.join(root, 'lib', 'res')

export const dirs = {
    root: root,
    app: app,
    build: build,
    tsOutput: tsOutput,
    finalOutput: finalOutput,
    res: res
}