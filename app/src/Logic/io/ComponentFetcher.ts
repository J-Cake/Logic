import Component from "../Component";
import {manager} from "../../index";
import RenderComponent from "../../ui/RenderComponent";
import * as sanitiser from '../../Plugin/sanitiser';
import initPlugin, {Plugin} from '../../Plugin/InitPlugin';
import {fetchData, pickFile, saveData} from "../../Plugin/API";
import {showModal} from "../../Plugin/DialogManager";

export type TruthTable = [boolean[], boolean[]][];
export type Body = TruthTable | { [componentId: number]: GenericComponent } | string;

// This is the shape of the component as received by the API. Consider this the JSON equivalent of a constructor
export interface ApiComponent {
    token: string,
    name: string,
    owner: string,
    component: Body,
    inputLabels: string[],
    outputLabels: string[],
    wires: wires
}

export type wires = {
    [dest: number]: [{
        coords: [number, number][],
        inputIndex: number,
        outputIndex: number
    }]
};

/**
 * This is a classless representation of a component that is in use.
*/
export interface GenericComponent {
    identifier?: string,
    direction: 0 | 1 | 2 | 3,
    flip: boolean,
    outputs: {
        [terminal: string]: [number, string][] // [terminal: string]: [destId: number, destTerminal: string][]
    }
    label: string,
    position: [number, number],
    wires: wires
}

const compareArray: <T>(arr1: T[], arr2: T[]) => boolean = function <T>(arr1: T[], arr2: T[]): boolean {
    if (arr1.length !== arr2.length)
        return false;
    return !arr1.map((i, a) => i === arr2[a]).includes(false);
}

export abstract class GenComponent extends Component {
    documentComponentKey: number;
    raw: ApiComponent | null;
    base: GenericComponent | null;

    protected constructor(documentComponentKey: number, inputs: string[], outputs: string[], name: string) {
        super(inputs, outputs, name);
        this.documentComponentKey = documentComponentKey;
        this.raw = null;
        this.base = null;
    }
}

export default async function fetchComponent(componentToken: string): Promise<new(mapKey: number, base: GenericComponent) => GenComponent> {
    const getComponent = await fetch(`/component/${componentToken}`);

    if (getComponent.ok) {
        const apiComponent: ApiComponent = await getComponent.json();
        apiComponent.token = componentToken;

        const requiredKeys: string[] = ['token', 'name', 'owner', 'component', 'inputLabels', 'outputLabels'];
        if (typeof apiComponent !== 'object' || requiredKeys.some(i => !(i in apiComponent)))
            throw {
                msg: 'Invalid Component'
            }

        if (apiComponent.component.constructor.name === "Array") { // it's a truth table
            return class StatelessComponent extends GenComponent {
                constructor(documentComponentKey: number, base: GenericComponent) {
                    super(documentComponentKey, apiComponent.inputLabels, apiComponent.outputLabels, apiComponent.name);
                    this.update();
                    this.raw = apiComponent;
                    this.base = base;

                    this.label = this.base.label;
                }

                computeOutputs(inputs: boolean[]): boolean[] {
                    return ((inputs: boolean[]) => {
                        for (const inputSet of apiComponent.component as TruthTable)
                            if (compareArray<boolean>(inputSet[0], inputs))
                                return inputSet[1];
                        return [];
                    })(inputs);
                }

                preUpdate(next: () => void): void {
                    manager.setState().debug.inspectComponent(this, () => next());
                }
            }
        } else if (typeof apiComponent.component === "object") { // it's a stateful component
            return class StatefulComponent extends GenComponent {
                private readonly memberComponents: { [id: number]: GenComponent };
                private readonly inputIds: number[] = [];
                private readonly outputIds: number[] = [];

                constructor(documentComponentKey: number, base: GenericComponent) {
                    super(documentComponentKey, apiComponent.inputLabels, apiComponent.outputLabels, apiComponent.name);

                    const availComponents = manager.setState().circuit.state.setState().availableComponents;

                    const memberComponents: { [id: number]: GenComponent } = {};

                    let componentId: number = -1;

                    for (const i in apiComponent.component as { [componentId: number]: GenericComponent }) {
                        memberComponents[++componentId] = new availComponents[i](Number(i), apiComponent.component[i] as GenericComponent);
                    }

                    this.memberComponents = memberComponents;

                    this.raw = apiComponent;
                    this.base = base;

                    this.label = this.base.label;

                    this.update();
                }

                computeOutputs(inputs: boolean[]): boolean[] { // TODO: Evaluate stateful components
                    return [];
                }

                preUpdate(next: () => void): void {
                    manager.setState().debug.inspectComponent(this, () => next());
                }

            }
        } else { // it's a dynamic component, the value is updated by a script located by the value of the string
            return class DynamicComponent extends GenComponent {
                plugin: Partial<Plugin>;

                constructor(documentComponentKey: number, base: GenericComponent) {
                    super(documentComponentKey, apiComponent.inputLabels, apiComponent.outputLabels, apiComponent.name);

                    this.plugin = {};
                    this.raw = apiComponent;
                    this.base = base;

                    this.label = this.base.label;

                    fetch(apiComponent.component as string).then(res => {
                        return res.text().then(fn => initPlugin(fn, apiComponent, {
                            component: {
                                onClick: (callback: (renderObj: sanitiser.SanitisedRenderer) => void) => this.plugin.onClick = callback,
                                setComputeFn: (callback: (inputs: boolean[]) => boolean[]) => this.plugin.computeFn = callback,
                                update: () => this.update(),
                                component: sanitiser.sanitiseComponent(this)
                            },
                            dialog: {
                                showModal,
                                pickFile
                            },
                            storage: {
                                saveData,
                                fetchData
                            }
                        }));
                    }).then(() => this.update());
                }

                preUpdate(next: () => void): void {
                    manager.setState().debug.inspectComponent(this, () => next());
                }

                computeOutputs(inputs: boolean[]): boolean[] {
                    // TODO: Offload computation to external script object
                    if (this.plugin && this.plugin.computeFn)
                        return this.plugin.computeFn(inputs);
                    return [];
                }

                activate(renderer: RenderComponent) {
                    if (this.plugin.onClick)
                        this.plugin.onClick(sanitiser.sanitiseRenderComponent(renderer));
                }
            }
        }
    } else // The Component doesn't exist
        throw 'Component doesn\'t exist';
}