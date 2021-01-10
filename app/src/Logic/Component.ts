export default abstract class Component {

    private readonly inputNames: string[];
    private readonly outputNames: string[];

    public readonly name: string;

    value: boolean[];

    private readonly outputs: Component[];
    private readonly inputs: Component[];

    private readonly inputIndex: number[];

    protected constructor(inputs: string[], outputs: string[], name: string) {
        this.inputNames = inputs;
        this.outputNames = outputs;

        this.outputs = [];
        this.inputs = [];

        this.inputIndex = [];

        this.value = new Array(outputs.length).fill(false);
        this.name = name;
    }

    abstract computeOutputs(inputs: boolean[]): boolean[];

    connect(component: Component): number {
        const l = this.outputs.push(component);
        component.addInput(this);
        return l;
    }

    getConnections(flip: boolean = false): [number, number] {
        return flip ? [this.outputs.length, this.inputs.length] : [this.inputs.length, this.outputs.length];
    }

    addInput(component: Component): number {
        const l = this.inputs.push(component);
        this.inputIndex.push(l);
        return l;
    }

    addOutput(component: Component): number {
        return component.outputs.push(component);
    }

    private getInputs(): boolean[] {
        return this.inputs.map((i, a) => i.value[this.inputIndex[a]]);
    }

    update() {
        for (const output of this.outputs)
            output.update();
    }
}
