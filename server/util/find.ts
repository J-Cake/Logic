import {exec} from 'child_process';
import readline from 'readline';
import {Readable} from 'stream';
import path from 'path';

import {rootFn} from "./utils";

type grep = {
    type: 'match',
    data: {
        path: {
            text: string
        },
        lines: {
            text: string
        },
        line_number: number,
        absolute_offset: number,

    }
}

/**
 * Search for a specific string in a list of files
 * @param string The string to search for
 */

export default async function* find(string: string): AsyncGenerator<[match: string, file: string]> {
    const root = path.join(await rootFn(), 'lib', 'doc', 'wiki');
    const proc = exec(`rg -i --json -tmd --line-buffered ${string} ${root}`);

    if (proc.stdout) {
        const s = new Readable({
            read() {
            },
            encoding: 'utf8'
        });

        const rl = readline.createInterface({
            input: proc.stdout,
            terminal: false
        });
        rl.on('line', line => s.push(line.replace(/\\n/g, '')));
        rl.on('close', () => s.destroy());
        rl.on('end', () => s.destroy());

        for await (const i of s) {
            for (const j of i.split(/(?<=})(?={)/g))
                if (j && typeof j === 'string') {
                    const match: grep = JSON.parse(j);

                    if (match.type === 'match')
                        yield [match.data.lines.text, match.data.path.text.startsWith(root) ? match.data.path.text.slice(root.length) : path.resolve(match.data.path.text)];
                }
        }
    } else
        throw "An error occurred";
}