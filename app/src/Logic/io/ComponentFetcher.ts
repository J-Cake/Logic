import Component from '../Component';
import {getComponent} from "../../sys/API/component";
import StatelessFactory from "../StatelessFactory";
import StatefulFactory from "../StatefulFactory";
import DynamicFactory from "../DynamicFactory";
import {CircuitObj} from "../../../../server/App/Document/Document";

export type TruthTable = [boolean[], boolean[]][];
export type Body = TruthTable | CircuitObj | string;

/**
 * This is the shape of the component as received by the API. Consider this the JSON equivalent of a constructor
 */
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

export const compareArray: <T>(arr1: T[], arr2: T[]) => boolean = function <T>(arr1: T[], arr2: T[]): boolean {
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
    const apiComponent: ApiComponent = (await getComponent(componentToken)).data as ApiComponent;
    apiComponent.token = componentToken;

    const requiredKeys: string[] = ['token', 'name', 'owner', 'component', 'inputLabels', 'outputLabels'];
    if (typeof apiComponent !== 'object' || requiredKeys.some(i => !(i in apiComponent)))
        throw {
            msg: 'Invalid Component'
        }

    if (apiComponent.component.constructor.name === "Array") // it's a truth table
        return StatelessFactory(apiComponent);
    else if (typeof apiComponent.component === "object") // it's a stateful component
        return StatefulFactory(apiComponent);
    else // it's a dynamic component, the value is updated by a script located by the value of the string
        return DynamicFactory(apiComponent);
}