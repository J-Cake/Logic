import * as path from "path";

import * as _ from 'lodash';

import sql from "./sql";
import getFile from "./getFile";
import type {ApiComponent, GenericComponent, TruthTable} from "../src/Logic/ComponentFetcher";
import {CircuitObj} from "./Circuit";
import StatelessComponent from "./StatelessComponent";
import {readFile} from "./FS";
import {attemptSync, rootFn} from "./utils";

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

    const components = _.mapValues(_.keyBy(await Promise.all(Object.entries(info.content).map(async ([a, i]) => [a, await fetchComponent(i)])), '0'), i => i && i[1]?.[1]);

    // Connect components
    for (const [a, i] of Object.entries(info.content)) {
        const comp_at_i = components[a];

        for (const [from, outputs] of Object.entries(i.outputs))
            for (const [comp, to] of outputs) {
                const destinationComponent = components[comp];

                if (destinationComponent instanceof StatelessComponent && comp_at_i instanceof StatelessComponent)
                    destinationComponent.addInput(comp_at_i, from, to);
                else if (info.content[comp].identifier === "std/output")
                    outputLocations.push([Number(a), from]);
            }
    }

    // Generate different combinations
    const combinations = parseInt(new Array(inputLocations.length).fill('1').join(''), 2);
    for (let i = 0; i <= combinations; i++) {
        const inputs: boolean[] = Array.from(i.toString(2).padStart(inputLocations.length, '0')).map(i => i === '1');

        for (const [a, i] of inputLocations.entries())
            for (const j of info.content[i].outputs['i'] /* these will be inputs */) {
                const comp = components[j[0]];
                if (comp instanceof StatelessComponent) {
                    comp.addOverride(inputs[a], comp.terminals[0].indexOf(j[1]));
                    // comp.update();
                }
            }

        for (const i of inputLocations.map(i => info.content[i].outputs['i'].map(i => components[i[0]])).flat(Infinity) as (StatelessComponent | string)[])
            if (i instanceof StatelessComponent)
                i.update();

        attemptSync(() => console.log(
            inputs,
            // _.mapValues(components, i => i instanceof StatelessComponent ? i.out : []),
            "->",
            // outputLocations.map(([comp, terminal]) => (components[comp] as StatelessComponent).terminals[1].indexOf(terminal)),
            outputLocations.map(([comp, terminal]) => (components[comp] as StatelessComponent).out[(components[comp] as StatelessComponent).terminals[1].indexOf(terminal)])
        ), err => console.error(err)); //print the index of the output terminal)
    }

    return [];
}

export async function fetchComponent(raw?: GenericComponent): Promise<[string, StatelessComponent | string] | null> {
    if (!raw?.identifier)
        return null;

    const source: ApiComponent = JSON.parse(raw?.identifier.startsWith('std/') ?
        await readFile(path.join(await rootFn(), 'lib', 'components', raw?.identifier.split('/').pop() + ".json")) : // Standard Component
        await sql.sql_get(`SELECT source
                           from components
                           where componentToken == ?`, [raw?.identifier])); // Custom Component

    if (Object.prototype.toString.call(source.component) === "[object Array]")
        return [raw?.identifier, new StatelessComponent(source.component as TruthTable, [source.inputLabels, source.outputLabels], raw)];
    else if (typeof source.component === "string")
        return [raw?.identifier, source.component];
    return null;
}