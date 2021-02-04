import type {CircuitObj} from "../server/Circuit";
import StateManager from "./sys/util/stateManager";
import Component from "./Logic/Component";
import fetchComponent, {GenComponent, GenericComponent} from "./ComponentFetcher";

export interface CircuitManagerState {
    components: GenComponent[],
    availableComponents: { [componentId: string]: new(mapKey: string) => GenComponent },
    componentMap: {[id: string]: [GenericComponent, Component]},
    document: CircuitObj
}

export default class CircuitManager {

    state: StateManager<CircuitManagerState>;
    loading: Promise<void>;
    readonly circuitId: string;

    constructor(circuitId: string) {
        this.state = new StateManager<CircuitManagerState>({});

        this.loading = this.loadCircuit(circuitId);
        this.circuitId = circuitId;
    }

    private async loadCircuit(circuitId: string) {
        const circuit = await fetch(`/circuit/raw/${circuitId}`);

        if (circuit.ok) {
            const loaded: CircuitObj = await circuit.json();

            const availSync: { [componentId: string]: new(mapKey: string) => GenComponent } = {};

            for (const id of loaded.components)
                availSync[id] = await fetchComponent(id);

            const components: {[id: string]: [GenericComponent, GenComponent]} = {};
            for (const i in loaded.content)
                if (loaded.content[i].identifier)
                    components[i] = [loaded.content[i], new availSync[loaded.content[i].identifier](i)];
                else
                    throw {};

            for (const [comp, obj] of Object.values(components))
                for (const output of comp.outputs)
                    components[output][1].addInput(obj);

            this.state.setState({
                availableComponents: availSync,
                components: Object.values(components).map(i => i[1]),
                componentMap: components,
                document: loaded
            }).components.forEach(i => i.update());
        }
    }

    addComponent(component: GenComponent) {
        this.state.setState(prev => ({
            components: [...prev.components, component]
        }));
    }

    getNextAvailComponentId(): string {
        return (this.state.setState().components.map(i => parseInt(i.documentComponentKey, 36)).reduce((a, i) => a > i ? a : i) + 1).toString(36);
    }
}