import _ from 'lodash';
import {GenericComponent, TruthTable} from '../../../app/src/Logic/io/ComponentFetcher';
import {attemptSync} from '../../util/utils';

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

    raw?: GenericComponent;

    override: (null | boolean)[] = [];

    constructor(truthTable: TruthTable, labels: [string[], string[]], raw?: GenericComponent) {
        this.truthTable = truthTable;
        this.inputs = {};
        this.outputs = _.mapValues(_.mapKeys(labels[1], i => i), () => []);
        this.out = this.compute(labels[0].map(() => false));
        this.terminals = labels;
        this.raw = raw;
    }

    addOverride(value: boolean, index: number) {
        this.override = new Array(Math.max(index, this.override.length)).fill(null).map((i, a) => typeof this.override[a] === "boolean" ? this.override[a] : null);
        this.override[index] = value;
    }

    getInputs(): boolean[] {
        const inputs = _.map(this.inputs, ([comp, terminal]) => comp.out[comp.terminals[1].indexOf(terminal)]);
        return _.merge(new Array(Math.max(this.override.length, inputs.length)).fill(0), this.override).map((i, a) => typeof i !== "boolean" ? inputs[a] : i);
    }

    compute(inputs: boolean[]): boolean[] {
        return ((inputs: boolean[]) => {
            for (const inputSet of this.truthTable as TruthTable)
                if (compareArray<boolean>(inputSet[0], inputs))
                    return inputSet[1];
            throw null;
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

    update() {
        attemptSync(() => this.out = this.compute(this.getInputs()));
        for (const a in this.outputs)
            for (const i of this.outputs[a])
                i[0].update();
    }
}