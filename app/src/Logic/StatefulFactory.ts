import {manager} from "../State";
import fetchComponent, {ApiComponent, GenComponent, GenericComponent} from "./io/ComponentFetcher";
import CircuitManager from "./io/CircuitManager";
import {CircuitObj} from "../../../server/App/Document/Document";
import {getDocument} from "../sys/API/circuit";
import {attempt} from "../../util";
import {getComponent} from "../sys/API/component";

export async function loadComponent(componentToken: string): Promise<{ [id: number]: [GenericComponent, GenComponent] }> {
    const component: ApiComponent = (await getComponent(componentToken)).data as ApiComponent;

    if (typeof component.component === 'object' && !('length' in component.component)) {
        const loaded = component.component as CircuitObj;
        const availSync: { [componentId: string]: new(mapKey: number, base: GenericComponent) => GenComponent } = {};

        for (const componentToken of loaded.components)
            await attempt(async () => availSync[componentToken] = await fetchComponent(componentToken),
                err => alert(`'${componentToken}' is corrupt, and the document cannot be loaded.`));

        const components: { [id: number]: [GenericComponent, GenComponent] } = {};
        for (const i in loaded.content)
            if (loaded.content[i].identifier)
                components[i] = [loaded.content[i], new availSync[loaded.content[i].identifier as string](Number(i), loaded.content[i])];
            else
                throw 'invalid component identifier';

        for (const [comp, obj] of Object.values(components))
            for (const i in comp.outputs)
                for (const j of comp.outputs[i])
                    components[j[0]][1].addInput(obj, i, j[1]);

        return components;
    }

    throw {
        msg: `Component is not statefully defined.`,
        token: componentToken,
        actualType: typeof component.component === 'string' ? 'dynamic' : 'stateless'
    };
}

export default function (apiComponent: ApiComponent) {
    return class StatefulComponent extends GenComponent {

        componentBody: CircuitObj;
        circuitMgr: CircuitManager;

        constructor(documentComponentKey: number, base: GenericComponent) {
            super(documentComponentKey, apiComponent.inputLabels, apiComponent.outputLabels, apiComponent.name);

            this.componentBody = apiComponent.component as CircuitObj;
            this.circuitMgr = new CircuitManager(apiComponent.token);
        }

        computeOutputs(inputs: boolean[]): boolean[] { // TODO: Evaluate stateful components
            return [];
        }

        preUpdate(next: () => void): void {
            manager.setState().debug.inspectComponent(this, () => next());
        }

    }
}