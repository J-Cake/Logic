import {manager} from "../State";
import {ApiComponent, GenComponent, GenericComponent} from "./io/ComponentFetcher";
import CircuitManager from "./io/CircuitManager";

export default function (apiComponent: ApiComponent) {
    return class StatefulComponent extends GenComponent {

        componentBody: ApiComponent;
        circuitMgr: CircuitManager;

        constructor(documentComponentKey: number, base: GenericComponent) {
            super(documentComponentKey, apiComponent.inputLabels, apiComponent.outputLabels, apiComponent.name);

            this.componentBody = apiComponent.component as ApiComponent;
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