import {TruthTable} from "../src/Logic/ComponentFetcher";

const compareArray: <T>(arr1: T[], arr2: T[]) => boolean = function <T>(arr1: T[], arr2: T[]): boolean {
    if (arr1.length !== arr2.length)
        return false;
    return !arr1.map((i, a) => i === arr2[a]).includes(false);
}

export default class StatelessComponent {
    truthTable: TruthTable;
    inputs: { [terminal: string]: [StatelessComponent, string] }
    outputs: { [terminal: string]: [StatelessComponent, string][] };
    out: boolean[];
    terminals: [string[], string[]];

    constructor(truthTable: TruthTable, labels: [string[], string[]]) {
        this.truthTable = truthTable;
        this.inputs = {};
        this.outputs = {};
        this.out = [];
        this.terminals = labels;
    }

    getInputs(): boolean[] {
        return this.terminals[0].map((i: string): boolean => {
            if (i in this.inputs)
                return this.inputs[i][0].out[this.inputs[i][0].terminals[0].indexOf(this.inputs[i][1])];
            else
                return false;
        });
    }

    compute(inputs: boolean[]): boolean[] {
        return ((inputs: boolean[]) => {
            for (const inputSet of this.truthTable as TruthTable)
                if (compareArray<boolean>(inputSet[0], inputs))
                    return inputSet[1];
            return [];
        })(inputs);
    }

    addInput(component: StatelessComponent, fromTerminal: string, toTerminal: string) {
        if (this.terminals[0].includes(toTerminal)) {
            this.inputs[toTerminal] = [component, fromTerminal];
            if (!component.outputs[fromTerminal])
                component.outputs[fromTerminal] = [];
            component.outputs[fromTerminal].push([this, toTerminal]);
        } else
            throw `Invalid connection - no input terminal '${toTerminal}'`;
    }

    update(doNotFetchInputs: boolean = true) {
        if (!doNotFetchInputs)
            this.out = this.compute(this.getInputs());
        for (const a in this.outputs)
            for (const i of this.outputs[a])
                i[0].update();
        // console.log(this.out);
    }
}