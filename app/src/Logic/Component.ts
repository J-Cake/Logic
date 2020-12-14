export default abstract class Component {

    private readonly inputNames: string[];
    private readonly outputNames: string[];

    value: boolean[];

    private readonly outputs: Component[];
    private readonly inputs: Component[];

    private readonly inputIndex: number[];

    protected constructor(inputs: string[], outputs: string[]) {
        this.inputNames = inputs;
        this.outputNames = outputs;

        this.outputs = [];
        this.inputs = [];

        this.inputIndex = [];

        this.value = new Array(outputs.length).fill(false);
    }

    abstract computeOutputs(inputs: boolean[]): boolean[];

    connect(component: Component): number {
        const l = this.outputs.push(component);
        component.addInput(this);
        return l;
    }

    addInput(component: Component): number {
        const l = this.inputs.push(component);
        this.inputIndex.push(l);
        this.update();
        return l;
    }

    private getInputs(): boolean[] {
        return this.inputs.map((i, a) => i.value[this.inputIndex[a]]);
    }

    update() {
        for (const output of this.outputs)
            output.update();
    }
}
