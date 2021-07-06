import path from 'path';

import _ from 'lodash';

import sql from '../../util/sql';
import getFile from './getFile';
import type {ApiComponent, GenericComponent, TruthTable} from '../../../app/document-editor/Logic/io/ComponentFetcher';
import {CircuitObj} from './Document';
import StatelessComponent from './StatelessComponent';
import {readFile} from '../../util/files';
import {attempt, rootFn} from '../../util/utils';

type TruthTableGenerator = {
    table: TruthTable,
    inputNames: string[],
    outputNames: string[]
}

const pickToken = async function () {
    let token: string;
    do
        token = Math.floor(Math.random() * 11e17).toString(36);
    while ((await sql.sql_get<{ componentToken: string }>(`SELECT "componentToken"
                                                           from components
                                                           where "componentToken" = $1`, [token]))?.componentToken);
    return token;
} // pick a token that isn't in use,

export default async function docToComponent(documentToken: string, userToken: string, stateful: boolean): Promise<string> {
    await attempt(async function () {
        const document = await sql.sql_get<{ source: string, documentTitle: string }>(`SELECT source, "documentTitle"
                                                                                       from documents
                                                                                       where "documentToken" = $1`, [documentToken]);
        const user = await sql.sql_get<{ email: string, userId: number }>(`SELECT email, "userId"
                                                                           from users
                                                                           where "userToken" = $1`, [userToken]);

        const file = await getFile(userToken, documentToken);
        if (!file)
            throw 'File access was denied';

        await file.fetchInfo();

        const componentDocument = await (async function (): Promise<ApiComponent> {
            if (!stateful) { // Set up a truth table
                const truthTable: TruthTableGenerator = await getTruthTable(file.info);
                return {
                    component: truthTable.table,
                    inputLabels: truthTable.inputNames,
                    name: document.documentTitle,
                    outputLabels: truthTable.outputNames,
                    owner: user.email,
                    token: await pickToken(), // pick a token that isn't in use,
                    wires: []
                }

            } else {
                const document: CircuitObj = await flattenComponent(file.info);
                return {
                    component: document,
                    inputLabels: Object.values(file.info.content).filter(i => i.token === '$input').map(i => i.label),
                    outputLabels: _.filter(file.info.content, i => i.token === '$output').map(i => i.label),
                    name: file.circuitName,
                    owner: user.email,
                    token: await pickToken(), // pick a token that isn't in use,
                    wires: [],
                }
            }
        })();

        await sql.sql_query(`INSERT INTO components ("ownerId", "componentToken", "componentName", source, "componentId")
                             values ($1, $2, $3, $4,
                                     coalesce((SELECT max("componentId") as "componentId" from components) + 1,
                                              0))`, [user.userId, componentDocument.token, componentDocument.name, JSON.stringify(componentDocument)]);
    }, err => console.error(err));
    return '';
}

export async function flattenComponent(info: CircuitObj): Promise<CircuitObj> {
    const isStateful: [string, boolean][] = await Promise.all(info.components.map(async function (token): Promise<[string, boolean]> {
        const component: ApiComponent = JSON.parse(token.startsWith('$') ?
            await readFile(path.join(await rootFn(), 'lib', 'components', token.slice(1) + ".json")) :
            await sql.sql_get(`SELECT source
                               from components
                               where "componentToken" = $1`, [token]));

        return [token, !Array.isArray(component.component) && typeof component.component === 'object'];
    }));

    // TODO: Flatten. That means loaded those components and connect them... have funnnnn!!

    return info;
}

export async function getTruthTable(info: CircuitObj): Promise<TruthTableGenerator> {
    const inputLocations: number[] = [];
    const outputLocations: [number, string][] = [];

    for (const [a, i] of Object.entries(info.content))
        if (i.token === "$input")
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
                else if (info.content[comp].token === "$output")
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
        outputNames: _.filter(info.content, i => i.token === '$output').map((i, a) => i.label ?? 'o' + a.toString(16)),
    };
}

export async function fetchComponent(raw?: GenericComponent): Promise<[string, StatelessComponent | string] | null> {
    if (!raw?.token)
        return null;

    const source: ApiComponent = JSON.parse(raw?.token.startsWith('$') ?
        await readFile(path.join(await rootFn(), 'lib', 'components', raw?.token.slice(1) + ".json")) : // Standard Component
        await sql.sql_get(`SELECT source
                           from components
                           where "componentToken" = $1`, [raw?.token])); // Custom Component

    if (Object.prototype.toString.call(source.component) === "[object Array]")
        return [raw?.token, new StatelessComponent(source.component as TruthTable, [source.inputLabels, source.outputLabels], raw)];
    else if (typeof source.component === "string")
        return [raw?.token, source.component];
    return null;
}