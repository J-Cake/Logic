import Component from "./Component";
import {Input, Output} from "./IO";
import {TruthTable} from "../ComponentFetcher";

export default class StatelessComponent extends Component {

    private truthTable: Map<boolean[], boolean[]>;

    constructor(components: Component[], identifier: string) {
        super(components.filter(i => i instanceof Input).map(i => (i as Input).label), components.filter(i => i instanceof Output).map(i => (i as Output).label), identifier);
        this.truthTable = this.makeTruthTable(components);
    }

    makeTruthTable(components: Component[]): Map<boolean[], boolean[]> {
        const map: Map<boolean[], boolean[]> = new Map<boolean[], boolean[]>();

        const inputs: Input[] = components.filter(i => i instanceof Input) as Input[];
        const outputs: Output[] = components.filter(i => i instanceof Output) as Output[];

        const nums = inputs.length;
        const combos = new Array(parseInt(new Array(nums).fill('1').join(''), 2) + 1).fill(0).map((i, a) => a.toString(2).padStart(nums, '0')).map(i => Array.from(i).map(i => i === '1'))

        return map;
    }

    computeOutputs(inputs: boolean[]): boolean[] {
        return [];
    }
}