import Component from "./Logic/Component";
import {manager} from "./index";
import RenderComponent from "./UI/RenderComponent";

export type TruthTable = [boolean[], boolean[]][];
export type Body = TruthTable | { [componentId: number]: GenericComponent } | string;

export interface Plugin {
    setComputeFn: (inputs: boolean[]) => boolean[],
    onClick: (renderObj: RenderComponent<GenComponent>) => void,

}

export interface ApiComponent { // This is the shape of the component as received by the API
    token: string,
    name: string,
    owner: string,
    component: Body,
    inputLabels: string[],
    outputLabels: string[],
}

export interface GenericComponent { // This is a classless representation of a component in use
    identifier: string,
    direction: 0 | 1 | 2 | 3
    inputs?: number[],
    outputs: number[],
    position: [number, number]
}

const compareArray: <T>(arr1: T[], arr2: T[]) => boolean = function <T>(arr1: T[], arr2: T[]): boolean {
    if (arr1.length !== arr2.length)
        return false;
    return !arr1.map((i, a) => i === arr2[a]).includes(false);
}

export abstract class GenComponent extends Component {
    documentComponentKey: string;

    protected constructor(documentComponentKey: string, inputs: string[], outputs: string[], name: string) {
        super(inputs, outputs, name);
        this.documentComponentKey = documentComponentKey;
    }
}

export default async function fetchComponent(component: string): Promise<new(mapKey: string) => GenComponent> {
    const getComponent = await fetch(`/component/${component}`);

    if (getComponent.ok) {
        const apiComponent: ApiComponent = await getComponent.json();

        if (apiComponent.component.constructor.name === "Array") { // it's a truth table
            return class extends GenComponent {
                constructor(documentComponentKey: string) {
                    console.log("Map Key:", documentComponentKey);
                    super(documentComponentKey, apiComponent.inputLabels, apiComponent.outputLabels, apiComponent.name);
                    this.update();
                }

                computeOutputs(inputs: boolean[]): boolean[] {
                    return ((inputs: boolean[]) => {
                        for (const inputSet of apiComponent.component as TruthTable)
                            if (compareArray<boolean>(inputSet[0], inputs))
                                return inputSet[1];
                        return [];
                    })(inputs);
                }
            }
        } else if (typeof apiComponent.component === "object") { // it's a stateful component
            return class extends GenComponent {
                private readonly memberComponents: { [id: number]: GenComponent };
                private readonly inputIds: number[] = [];
                private readonly outputIds: number[] = [];

                constructor(documentComponentKey: string) {
                    super(documentComponentKey, apiComponent.inputLabels, apiComponent.outputLabels, apiComponent.name);

                    const availComponents = manager.setState().circuit.state.setState().availableComponents;

                    const memberComponents: { [id: number]: GenComponent } = {};

                    let componentId: number = -1;

                    for (const i in apiComponent.component as { [componentId: number]: GenericComponent }) {
                        memberComponents[++componentId] = new availComponents[i](i);

                        if ((apiComponent.component[i] as GenericComponent).identifier === "std/input")
                            this.inputIds.push(componentId);
                        else if ((apiComponent.component[i] as GenericComponent).identifier === "std/output")
                            this.outputIds.push(componentId);
                    }

                    this.memberComponents = memberComponents;

                    this.update();
                }

                computeOutputs(inputs: boolean[]): boolean[] { // TODO: Evaluate stateful components
                    return [];
                }

            }
        } else { // it's a dynamic component, the value is updated by a script located by the value of the string
            return class extends GenComponent {
                plugin: Partial<Plugin>;

                constructor(documentComponentKey: string) {
                    super(documentComponentKey, apiComponent.inputLabels, apiComponent.outputLabels, apiComponent.name);

                    let plugin: Partial<Plugin> = {};

                    fetch(apiComponent.component as string).then(res => {
                        return res.text().then(fn => plugin = new Function(fn)()(apiComponent)({ // wtf
                            onClick: (callback: (renderObj: RenderComponent<GenComponent>) => void) => plugin.onClick = callback,
                            setComputeFn: (callback: (inputs: boolean[]) => boolean[]) => plugin.setComputeFn = callback,
                            update: () => this.update(),
                            component: this
                        }));
                    }).then(() => this.update());

                    this.plugin = plugin;
                }

                computeOutputs(inputs: boolean[]): boolean[] {
                    // TODO: Offload computation to external script object
                    if (this.plugin && this.plugin.setComputeFn)
                        return this.plugin.setComputeFn(inputs);
                    return [];
                }

                activate(renderer: RenderComponent<GenComponent>) {
                    if (this.plugin.onClick)
                        this.plugin.onClick(renderer);
                }
            }
        }
    } else // The Component doesn't exist
        throw {};
}