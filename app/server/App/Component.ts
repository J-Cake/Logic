import * as path from "path";

import * as _ from 'lodash';

import sql from "../sql";
import getFile from "../getFile";
import type {ApiComponent, GenericComponent, TruthTable} from "../../src/Logic/io/ComponentFetcher";
import {CircuitObj} from "./Circuit";
import StatelessComponent from "./StatelessComponent";
import {readFile} from "../FS";
import {attempt, rootFn} from "../utils";

type TruthTableGenerator = {
    table: TruthTable,
    inputNames: string[],
    outputNames: string[]
}

export default async function docToComponent(documentToken: string, userToken: string, stateful: boolean): Promise<string> {
    await attempt(async function () {
        const document = await sql.sql_get<{ source: string, documentTitle: string }>(`SELECT source, documentTitle
                                                                                       from documents
                                                                                       where documentToken == ?`, [documentToken]);
        const user = await sql.sql_get<{ email: string, userId: number }>(`SELECT email, userId
                                                                           from users
                                                                           where userToken == ?`, [userToken]);

        const file = await getFile(userToken, documentToken);
        if (!file)
            throw 'File access was denied';

        await file.fetchInfo();

        if (!stateful) { // Set up a truth table
            const truthTable: TruthTableGenerator = await getTruthTable(file.info);
            const componentDocument: ApiComponent = {
                component: truthTable.table,
                inputLabels: truthTable.inputNames,
                name: document.documentTitle,
                outputLabels: truthTable.outputNames,
                owner: user.email,
                token: Math.floor(Math.random() * 11e17).toString(36), // pick a token that isn't in use,
                wires: []
            }
            await sql.sql_query(`INSERT INTO components (ownerId, componentToken, componentName, source, componentId)
                                 values ($ownerId, $compToken,
                                         $compName, $source, coalesce((SELECT max(componentId) as componentId from components) + 1, 0))`, {
                $ownerId: user.userId,
                $compToken: componentDocument.token,
                $compName: componentDocument.name,
                $source: JSON.stringify(componentDocument)
            });
        }
    }, err => console.error(err));
    return '';
}

export async function getTruthTable(info: CircuitObj): Promise<TruthTableGenerator> {
    const inputLocations: number[] = [];
    const outputLocations: [number, string][] = [];

    for (const [a, i] of Object.entries(info.content))
        if (i.identifier === "std/input")
            inputLocations.push(Number(a));

    type connectMap = (number | connectMap)[];

    const truthTable: TruthTable = [];

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
                if (comp instanceof StatelessComponent)
                    comp.addOverride(inputs[a], comp.terminals[0].indexOf(j[1]));
            }

        for (const i of inputLocations.map(i => info.content[i].outputs['i'].map(i => components[i[0]])).flat(Infinity) as (StatelessComponent | string)[])
            if (i instanceof StatelessComponent)
                i.update();

        // Fetch outputs
        truthTable.push([inputs, outputLocations.map(([comp, terminal]) => (components[comp] as StatelessComponent).out[(components[comp] as StatelessComponent).terminals[1].indexOf(terminal)])]);
    }

    return {
        table: truthTable,
        inputNames: inputLocations.map((i, a) => info.content[i].label ?? 'i' + a.toString(16)),
        outputNames: _.filter(info.content, i => i.identifier === 'std/output').map((i, a) => i.label ?? 'o' + a.toString(16)),
    };
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