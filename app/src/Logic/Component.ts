import RenderComponent from "../UI/RenderComponent";

export default abstract class Component {

    private readonly inputNames: string[];
    private readonly outputNames: string[];

    public readonly name: string;

    value: boolean[];

    private readonly inputs: Component[];
    private readonly outputs: Component[];

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
        component.outputs.push(this);
        this.inputIndex.push(this.inputs.push(component));
    }

    update() { // THIS FUCKING FUNCTION TOOK ME FOREVER TO WRITE
        this.out = this.computeOutputs(this.inputs.map((i, a) => i.out[this.inputIndex[a]]));
        for (const out of this.outputs)
            out.update();
    }

    activate(renderer: RenderComponent<Component>) {
        this.update();
    }
}
