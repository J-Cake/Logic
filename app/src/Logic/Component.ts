import RenderComponent from "../UI/RenderComponent";

export const containsDuplicates = (list: string[]): boolean => new Set(list).size !== list.length;

export default abstract class Component {

    readonly inputNames: string[];
    readonly outputNames: string[];

    public readonly name: string;

    public label: string;

    value: boolean[];

    readonly inputs: { [terminal: string]: [Component, string] };
    readonly outputs: { [terminal: string]: [Component, string][] }
    // readonly outputs: Component[];

    out: boolean[];
    prevInput: [boolean[], boolean[]];
    outCache: { [terminal: string]: boolean };
    updated: boolean;
    isRecursive: boolean;

    isBreakpoint: boolean;

    protected constructor(inputs: string[], outputs: string[], name: string) {
        if (containsDuplicates(inputs) || containsDuplicates(outputs))
            throw {msg: 'The label lists must only contain unique entries.'}

        this.inputNames = inputs;
        this.outputNames = outputs;

        this.inputs = {};
        this.outputs = {};

        this.prevInput = new Array(2).fill(Array.from(this.inputNames.map(i => i in this.inputs ? (this.inputs[i][0].out[this.inputs[i][0].outputNames.indexOf(i)]) : false))) as [boolean[], boolean[]];
        this.out = this.computeOutputs(this.prevInput[this.prevInput.length - 1]); // get the list of default values

        this.outCache = {};

        for (const [a, i] of this.outputNames.entries())
            this.outCache[i] = this.out[a] || false;

        this.value = new Array(outputs.length).fill(false);
        this.label = this.name = name;

        this.updated = false;
        this.isRecursive = false;
        this.isBreakpoint = false;
    }

    abstract computeOutputs(inputs: boolean[]): boolean[];

    abstract preUpdate(next: (() => void)): void;

    isRecursivelyConnected(component: Component): boolean {
        const compare: Component = this;
        const checked: Component[] = [];
        const checkComponent = function (component: Component): boolean {
            if (checked.includes(component))
                return true;
            else
                checked.push(component)

            for (const i in component.outputs)
                if (component.outputs[i].some(i => i[0] === compare || checkComponent(i[0])))
                    return true;
            return false;
        }

        return checkComponent(component);
    }

    addInput(component: Component, from: string, to: string) {
        if (!this.inputs[to]) {

            this.isRecursive = this.isRecursivelyConnected(component);

            this.inputs[to] = [component, from];
            if (!component.outputs[from])
                component.outputs[from] = [];
            component.outputs[from].push([this, to]);
        }

    }

    getInputs(): boolean[] {
        return this.inputNames.map((i: string): boolean => {
            if (i in this.inputs)
                return this.inputs[i][0].outCache[this.inputs[i][1]];
            else
                return false;
        });
    }

    update() { // THIS FUCKING FUNCTION TOOK ME FOREVER TO WRITE
        const inputs: boolean[] = this.getInputs();

        const update = function (this: Component, next: boolean[], noRipple: boolean = false) {
            this.out = next;
            if (this.isBreakpoint)
                console.log("Updating", this.name);
                // console.log(this.name, this.prevInput, inputs);
            this.prevInput.shift();
            this.prevInput.push(Array.from(inputs));
            this.outCache = {};

            for (const [a, i] of this.outputNames.entries())
                this.outCache[i] = this.out[a] || false;

            if (!this.updated) { // wait for the next render tick, allowing the stack to reduce.
                this.updated = true;

                for (const a in this.outputs)
                    for (const i of this.outputs[a])
                        i[0].update();
            }
        }.bind(this);

        const next = this.computeOutputs(inputs);

        if (this.isBreakpoint &&
            (next.some((i, a) => this.out[a] !== i) || this.prevInput[1].some((i, a) => this.prevInput[0][a] !== i)))
            // check if outputs will change
            this.preUpdate(() => update(next));
        else
            update(next);
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
