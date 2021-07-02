import _ from 'lodash';
import RenderComponent from '../ui/RenderComponent';
import {DebugMode} from '../Enums';
import {manager} from '../State';
import {ApiComponent} from "./io/ComponentFetcher";

export const containsDuplicates = (list: string[]): boolean => new Set(list).size !== list.length;

export default abstract class Component {

    readonly inputNames: string[];
    readonly outputNames: string[];

    public readonly name: string;

    public label: string;

    readonly inputs: { [terminal: string]: [Component, string] };
    readonly outputs: { [terminal: string]: [Component, string][] }

    private outs: boolean[];
    prevInput: [boolean[], boolean[]];
    outCache: { [terminal: string]: boolean };
    private _updated: boolean;
    isRecursive: boolean;

    isBreakpoint: DebugMode | null;
    public breakNext: boolean = false;
    public halted: boolean = false;

    protected override: (null | boolean)[] = [];

    protected constructor(inputs: string[], outputs: string[], name: string) {
        if (containsDuplicates(inputs) || containsDuplicates(outputs))
            throw 'The label lists must only contain unique entries.';

        this.inputNames = inputs;
        this.outputNames = outputs;

        this.inputs = {};
        this.outputs = {};

        this.prevInput = new Array(2).fill(Array.from(this.inputNames.map(i => i in this.inputs ? (this.inputs[i][0].out[this.inputs[i][0].outputNames.indexOf(i)]) : false))) as [boolean[], boolean[]];
        this.outs = this.computeOutputs(this.prevInput[this.prevInput.length - 1]); // get the list of default values

        this.outCache = {};

        for (const [a, i] of this.outputNames.entries())
            this.outCache[i] = this.out?.[a] ?? false;

        this.label = this.name = name;

        this._updated = false;
        this.isRecursive = false;
        this.isBreakpoint = null;
        this.override = [];
    }

    get updated(): boolean {
        return this._updated;
    }

    set updated(updated: boolean) {
        this._updated = updated;
    }

    addOverride(value: boolean, index: number) {
        this.override = new Array(Math.max(index, this.override.length)).fill(null).map((i, a) => typeof this.override[a] === "boolean" ? this.override[a] : null);
        this.override[index] = value;
    }

    get out() {
        return _.merge(new Array(Math.max(this.override.length, this.outs.length)).fill(0), this.override).map((i, a) => typeof i !== "boolean" ? this.outs[a] : i);
    }
    set out(value: boolean[]) {
        this.outs = value;
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

    meetsBreakCondition(input: boolean[], output: boolean[]): boolean {
        console.log(this.prevInput[1].concat(this.out), input.concat(output));
        if (this.isBreakpoint !== null)
            return ({
                [DebugMode.Input]: () => !_.isEqual(this.prevInput[1], input), // this.prevInput[1].some((i, a) => input[a] !== i),
                [DebugMode.Output]: () => !_.isEqual(this.out, output), // this.out.some((i, a) => output[a] !== i),
                [DebugMode.Change]: () => !_.isEqual(this.prevInput[1].concat(this.out), input.concat(output)),
                [DebugMode.Update]: () => true,
            } as Record<DebugMode, () => boolean>)[this.isBreakpoint]()
        else
            return false;
    }

    update() { // THIS FUCKING FUNCTION TOOK ME FOREVER TO WRITE
        const update = function (this: Component) {
            const inputs: boolean[] = this.getInputs();

            const update = function (this: Component, next: boolean[], noRipple: boolean = false) {
                if (next) // may not be defined, if the component is a dynamic component, and no value was returned. In this case, inform user with an error
                    this.out = next;
                else
                    throw {
                        msg: `No value was returned from \`compute\` on ${this.name}.`,
                        component: this,
                    }

                this.halted = false;

                this.prevInput.shift();
                this.prevInput.push(Array.from(inputs));
                this.outCache = {};

                for (const [a, i] of this.outputNames.entries())
                    this.outCache[i] = this.out[a] || false;

                if (!this.updated) { // wait for the next render tick, allowing the stack to reduce.
                    this.updated = true;

                    if (!noRipple)
                        for (const a in this.outputs)
                            for (const i of this.outputs[a]) {
                                if (this.breakNext)
                                    i[0].breakNext = true;
                                i[0].update();
                            }
                }
            }.bind(this);

            const next = this.computeOutputs(inputs);

            if (this.breakNext || (this.isBreakpoint !== null && this.meetsBreakCondition(inputs, next))) {
                this.halted = true;
                this.preUpdate(() => update(next));
                // console.log("Breaking", this);
            } else
                update(next);
        }.bind(this);
        if (!manager.setState().debug.isStopped())
            update();
        else {
            const listener = manager.setState().debug.on('continue', () => {
                update();
                manager.setState().debug.off(listener);
            });
        }
    }

    activate(renderer: RenderComponent) {
        this.update();
    }

    dropAll() {
        for (const a in this.inputs)
            this.dropInput(a);

        for (const a in this.outputs)
            for (const i of this.outputs[a])
                i[0].dropOutputRecursive(i[1], this);
    }

    /**
     * Disconnects two components, by dropping the *input*.
     * > Disconnects the components on the output side as well.
     * @param input The *input* terminal to disconnect.
     */
    dropInput(input: string) {
        if (input in this.inputs) {
            const [comp, terminal] = this.inputs[input];
            const index = comp.outputs[terminal].findIndex(i => i[0] === this);

            if (index > -1)
                comp.outputs[terminal].splice(index, 1);
            delete this.inputs[input]; // Don't worry. Delete only removes the key from the dictionary, not the actual value in memory.
        }
    }

    /**
     * Removes connection through outputs
     * > Does not disconnect components through inputs.
     * @param output The terminal on which to find the component to disconnect
     * @param comp The component to disconnect from
     */
    dropOutput(output: string, comp: Component) {
        if (output in this.outputs)
            delete this.outputs[output][this.outputs[output].findIndex(i => i[0] === comp)];
    }

    /**
     * Same as Component::dropOutput, except removes inputs
     * @param output
     * @param comp
     */
    dropOutputRecursive(output: string, comp: Component) {
        if (output in this.outputs) {
            const componentIndex = this.outputs[output].findIndex(i => i[0] === comp);
            const connection = this.outputs[output]?.[componentIndex]
            connection[0].dropInput(connection[1]);

            delete this.outputs[output][componentIndex];
        }
    }
}