import * as path from "path";

import * as _ from 'lodash';

import sql from "./sql";
import getFile from "./getFile";
import type {ApiComponent, GenericComponent, TruthTable} from "../src/Logic/ComponentFetcher";
import {CircuitObj} from "./Circuit";
import StatelessComponent from "./StatelessComponent";
import {readFile} from "./FS";
import {rootFn} from "./utils";
import * as util from "util";

export default async function docToComponent(documentToken: string, userToken: string, stateful: boolean): Promise<string> {
    const document = await sql.sql_get<{ source: string }>(`SELECT source
                                                            from documents
                                                            where documentToken == ?`, [documentToken]);

    const file = await getFile(userToken, documentToken);
    if (!file)
        throw 'File access was denied';

    await file.fetchInfo();

    if (!stateful) { // Set up a truth table
        const truthTable: TruthTable = await getTruthTable(file.info);
    }

    return '';
}

export async function getTruthTable(info: CircuitObj): Promise<TruthTable> {
    const inputLocations: number[] = [];
    const outputLocations: [number, string][] = [];

    for (const [a, i] of Object.entries(info.content))
        if (i.identifier === "std/input")
            inputLocations.push(Number(a));

    type connectMap = (number | connectMap)[];

    // Check for recursive connections
    const getOutputs = (i: GenericComponent): number[] => Object.values(i.outputs).map(i => i.map(i => i[0])).flat();
    const isRecursive = function (a: number[], i: GenericComponent): boolean {
        const outputs = getOutputs(i);
        if (a.some(b => outputs.includes(b)))
            return true;

        for (const j of outputs)
            if (isRecursive(a.concat(j), info.content[j]))
                return true;

        return false;
    }

    for (const [a, i] of Object.entries(info.content))
        if (isRecursive([Number(a)], i))
            throw 'Conversion failed: Contains recursively connected components';

    const components = _.mapValues(_.keyBy(await Promise.all(Object.entries(info.content).map(async ([a, i]) => [a, await fetchComponent(i.identifier)])), '0'), i => i && i[1]?.[1]);

    for (const [a, i] of Object.entries(components)) {
        if (i instanceof StatelessComponent)
            for (const [from, connections] of Object.entries(info.content[Number(a)].outputs))
                for (const [comp, to] of connections) {
                    const source: null | string | StatelessComponent = i ?? null;
                    const dest: null | string | StatelessComponent = components[comp] ?? null;
                    try {
                        if (source && dest)
                            if (typeof dest === "string")
                                outputLocations.push([Number(a), from]);
                            else if (dest)
                                dest?.addInput(source, from, to);
                            else console.log("Unable to connect to", dest);
                        else
                            console.log("Unable to connect from", source);
                    } catch (err) {
                        console.error(err);
                        console.log("Comp", comp, "From", from, "To", to);
                        console.log(source);
                    }
                }
    }

    const combinations = parseInt(new Array(inputLocations.length).fill('1').join(''), 2);
    for (let i = 0; i <= combinations; i++) {
        const inputs: boolean[] = Array.from(i.toString(2).padStart(inputLocations.length, '0')).map(i => i === '1');

        // for (const i of Object.values(components))
        //     if (i instanceof StatelessComponent)
        //

        for (const [a, i] of inputLocations.entries())
            for (const j of info.content[i].outputs['i'] /* these will be inputs */) {
                const comp = components[j[0]];
                if (comp instanceof StatelessComponent) {
                    comp.out = comp.compute(comp.getInputs());
                    comp.out[comp.terminals[0].indexOf(j[1])] = inputs[a];
                    comp.update(true);
                }
            }

        console.log(util.inspect(components, false, null, true));
    }

    return [];
}

export async function fetchComponent(componentToken?: string): Promise<[string, StatelessComponent | string] | null> {
    if (!componentToken)
        return null;

    const source: ApiComponent = JSON.parse(componentToken.startsWith('std/') ?
        await readFile(path.join(await rootFn(), 'lib', 'components', componentToken.split('/').pop() + ".json")) : // Standard Component
        await sql.sql_get(`SELECT source
                           from components
                           where componentToken == ?`, [componentToken])); // Custom Component

    if (Object.prototype.toString.call(source.component) === "[object Array]")
        return [componentToken, new StatelessComponent(source.component as TruthTable, [source.inputLabels, source.outputLabels])];
    else if (typeof source.component === "string")
        return [componentToken, source.component];
    return null;
}