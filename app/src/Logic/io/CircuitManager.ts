import type {CircuitObj} from '../../../../server/App/Document/Document';
import StateManager from '../../sys/util/stateManager';
import Component from '../Component';
import fetchComponent, {ApiComponent, GenComponent, GenericComponent} from './ComponentFetcher';
import {manager} from '../../State';
import {attempt} from '../../../util';
import {getDocument} from "../../sys/API/circuit";

export interface CircuitManagerState {
    components: GenComponent[],
    availableComponents: { [componentId: string]: new(mapKey: number, base: GenericComponent) => GenComponent },
    raw: { [token: string]: ApiComponent };
    componentMap: { [id: string]: [GenericComponent, Component] },
    document: CircuitObj
}

export type AvailSync = {
    [componentId: string]: new(mapKey: number, base: GenericComponent) => GenComponent
};
export type ComponentMap = { [id: number]: [GenericComponent, GenComponent] };

export default class CircuitManager {
    state: StateManager<CircuitManagerState>;
    loading: Promise<{ [id: number]: [GenericComponent, GenComponent] }>;
    readonly circuitId: string;

    constructor(circuitId: string) {
        this.state = new StateManager<CircuitManagerState>({raw: {}});

        this.loading = this.loadCircuit(circuitId)
            .then(function (this: CircuitManager, k: { [p: number]: [GenericComponent, GenComponent] }) {
                manager.dispatch('loaded', {ready: true});
                return k;
            }.bind(this));
        this.circuitId = circuitId;

        manager.broadcast('tick');
    }

    deleteSelected() {
        for (const i of manager.setState().renderedComponents)
            for (const j of i.wires)
                for (const k of j.handles ?? [])
                    if (k.isSelected) {
                        k.onDelete();
                        j.handles?.splice(j?.handles.indexOf(k), 1);
                    }

        const selected = manager.setState().renderedComponents.filter(i => i.isSelected);
        for (const comp of selected) {
            comp.component.dropAll();
            comp.deleted = true;
            comp.wires = [];
        }

        manager.setState(prev => ({
            renderedComponents: prev.renderedComponents.filter(i => !i.isSelected)
        }));
    }

    addComponent(component: GenComponent) {
        this.state.setState(prev => ({
            components: [...prev.components, component]
        }));
    }

    getNextAvailComponentId(): number {
        return Math.max(...this.state.setState().components.map(i => i.documentComponentKey));
    }

    static async parseCircuit(loaded: CircuitObj): Promise<[avail: AvailSync, comps: ComponentMap]> {
        const availSync: AvailSync = {};

        for (const componentToken of loaded.components)
            await attempt(async () => availSync[componentToken] = await fetchComponent(componentToken),
                err => alert(`'${componentToken}' is corrupt, and the document cannot be loaded.`));

        const components: { [id: number]: [GenericComponent, GenComponent] } = {};
        for (const i in loaded.content)
            if (loaded.content[i].token && availSync.hasOwnProperty(loaded.content[i].token ?? ''))
                components[i] = [loaded.content[i], new availSync[loaded.content[i].token as string](Number(i), loaded.content[i])];
            else
                throw `invalid component identifier ${i}`;

        for (const [comp, obj] of Object.values(components))
            for (const i in comp.outputs)
                for (const j of comp.outputs[i])
                    components[j[0]][1].addInput(obj, i, j[1]);

        return [availSync, components];
    }

    private async loadCircuit(circuitId: string): Promise<{ [id: number]: [GenericComponent, GenComponent] }> {
        const loaded: CircuitObj = (await getDocument(circuitId)).data as CircuitObj;

        const [availSync, components] = await CircuitManager.parseCircuit(loaded);

        this.state.setState({
            availableComponents: availSync,
            components: Object.values(components).map(i => i[1]),
            componentMap: components,
            document: loaded
        }).components.forEach(i => i.update());

        return components;
    }
}