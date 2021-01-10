import type {CircuitObj} from "../server/Circuit";
import StateManager from "./sys/util/stateManager";
import Component from "./Logic/Component";
import fetchComponent, {GenComponent, GenericComponent} from "./ComponentFetcher";

interface CircuitManagerState {
    components: GenComponent[],
    availableComponents: { [componentId: string]: new(mapKey: string) => GenComponent },
    componentMap: {[id: string]: [GenericComponent, Component]},
    document: CircuitObj
}

export default class CircuitManager {

    state: StateManager<CircuitManagerState>;
    loading: Promise<void>;

    constructor(circuitId: string) {
        this.state = new StateManager<CircuitManagerState>({});

        this.loading = this.loadCircuit(circuitId);
    }

    private async loadCircuit(circuitId: string) {
        const circuit = await fetch(`/circuit/raw/${circuitId}`);

        if (circuit.ok) {
            const loaded: CircuitObj = await circuit.json();

            const avail: { [componentId: string]: Promise<new(mapKey: string) => GenComponent> } = {};
            const availSync: { [componentId: string]: new(mapKey: string) => GenComponent } = {};

            for (const id of loaded.components)
                avail[id] = fetchComponent(id);

            const components: {[id: string]: [GenericComponent, GenComponent]} = {};
            for (const i in loaded.content) {
                if (loaded.content[i].identifier)
                    components[i] = [loaded.content[i], new (availSync[loaded.content[i].identifier] = await avail[loaded.content[i].identifier])(i)];
                else
                    throw {};
            }

            for (const [comp, obj] of Object.values(components))
                for (const output of comp.outputs) {
                    components[output][1].addInput(obj);
                    components[output][1].addOutput(obj);
                }

            this.state.setState({
                availableComponents: availSync,
                components: Object.values(components).map(i => i[1]),
                componentMap: components,
                document: loaded
            });
        }
    }

    addComponent(component: GenComponent) {
        this.state.setState(prev => ({
            components: [...prev.components, component]
        }));
    }
}