import RenderComponent from "../UI/RenderComponent";

export default abstract class Component {

    readonly inputNames: string[];
    readonly outputNames: string[];

    public readonly name: string;

    value: boolean[];

    readonly inputs: Component[];
    readonly outputs: Component[];

    private readonly inputIndex: number[];

    out: boolean[];

    protected constructor(inputs: string[], outputs: string[], name: string) {
        this.inputNames = inputs;
        this.outputNames = outputs;

        this.inputs = [];
        this.outputs = [];

        this.inputIndex = [];

        this.out = this.computeOutputs(this.inputs.map((i, a) => i.out[this.inputIndex[a]]));

        this.value = new Array(outputs.length).fill(false);
        this.name = name;
    }

    abstract computeOutputs(inputs: boolean[]): boolean[];

    getConnections(flip: boolean = false): [number, number] {
        return flip ? [this.outputs.length, this.inputs.length] : [this.inputs.length, this.outputs.length];
    }

    addInput(component: Component) {
        this.inputs.push(component);
        this.inputIndex.push(component.outputs.push(this) - 1);
    }

    update() { // THIS FUCKING FUNCTION TOOK ME FOREVER TO WRITE
        const inputs = this.inputs.map((i, a) => i.out[this.inputIndex[a]]);
        this.out = this.computeOutputs(inputs);

        this.outputs.forEach(i => i.update());
    }

    activate(renderer: RenderComponent) {
        this.update();
    }
}
