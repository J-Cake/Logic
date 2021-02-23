import RenderComponent from "../UI/RenderComponent";
import {GenComponent} from "./ComponentFetcher";

export const containsDuplicates = (list: string[]): boolean => new Set(list).size !== list.length;

export default abstract class Component {

    readonly inputNames: string[];
    readonly outputNames: string[];

    public readonly name: string;

    value: boolean[];

    readonly inputs: { [terminal: string]: [Component, string] };
    readonly outputs: { [terminal: string]: [Component, string][] }
    // readonly outputs: Component[];

    out: boolean[];
    outCache: { [terminal: string]: boolean };
    updated: boolean;
    isRecursive: boolean;

    protected constructor(inputs: string[], outputs: string[], name: string) {
        if (containsDuplicates(inputs) || containsDuplicates(outputs))
            throw {msg: 'The label lists must only contain unique entries.'}

        this.inputNames = inputs;
        this.outputNames = outputs;

        this.inputs = {};
        this.outputs = {};

        this.out = this.computeOutputs(this.inputNames.map(i => i in this.inputs ? (this.inputs[i][0].out[this.inputs[i][0].outputNames.indexOf(i)]) : false)); // get the list of default values
        this.outCache = {};

        for (const [a, i] of this.outputNames.entries())
            this.outCache[i] = this.out[a] || false;

        this.value = new Array(outputs.length).fill(false);
        this.name = name;

        this.updated = false;
        this.isRecursive = false;
    }

    abstract computeOutputs(inputs: boolean[]): boolean[];

    isRecursivelyConnected(component: Component): boolean {
        const compare = this;
        const checkComponent = function (component: Component): boolean {
            for (const i in component.outputs)
                if (component.outputs[i].find(i => i[0] === compare) || component.outputs[i].map(i => checkComponent(i[0])))
                    return true
            return false;
        }

        return (component === compare) || checkComponent(component);
    }

    addInput(component: Component, from: string, to: string) {
        if (!this.inputs[to]) {

            this.inputs[to] = [component, from];
            if (!component.outputs[from])
                component.outputs[from] = [];
            component.outputs[from].push([this, to]);
        }

    }

    update() { // THIS FUCKING FUNCTION TOOK ME FOREVER TO WRITE
        const inputs: boolean[] = this.inputNames.map((i: string): boolean => {
            if (i in this.inputs)
                return this.inputs[i][0].outCache[this.inputs[i][1]];
            else
                return false;
        });

        this.out = this.computeOutputs(inputs);
        this.outCache = {};

        for (const [a, i] of this.outputNames.entries())
            this.outCache[i] = this.out[a] || false;

        if (!this.updated) { // wait for the next render tick, allowing the stack to reduce.
            this.updated = true;

            for (const a in this.outputs)
                for (const i of this.outputs[a])
                    i[0].update();
        }
    }

    activate(renderer: RenderComponent) {
        this.update();
    }

    dropAll() {
        for (const a in this.inputs)
            this.inputs[a][0].outputs[this.inputs[a][1]].splice(this.inputs[a][0].outputs[this.inputs[a][1]].findIndex(i => i[0] === this), 1);

        for (const a in this.outputs)
            for (const b in this.outputs[a])
                delete this.outputs[a][b][0].inputs[this.outputs[a][b][1]];
    }
}
