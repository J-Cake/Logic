import _ from 'lodash';

import {manager} from "../State";
import {ApiComponent, GenComponent, GenericComponent, PlaceholderComponent} from "./io/ComponentFetcher";
import CircuitManager, {AvailSync, ComponentMap} from "./io/CircuitManager";
import {CircuitObj} from "../../../server/App/Document/Document";
import {getComponent} from "../sys/API/component";

export async function loadComponent(componentToken: string): Promise<{ [id: number]: [GenericComponent, GenComponent] }> {
    const component: ApiComponent = (await getComponent(componentToken)).data as ApiComponent;

    if (typeof component.component === 'object' && !('length' in component.component)) {
        const [availSync, loaded] = await CircuitManager.parseCircuit(component.component);
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
        componentMap!: ComponentMap;

        private readonly inputComponents!: PlaceholderComponent[];
        private readonly outputComponents!: PlaceholderComponent[];

        constructor(documentComponentKey: number, base: GenericComponent) {
            super({
                documentComponentKey: documentComponentKey,
                inputs: apiComponent.inputLabels,
                outputs: apiComponent.outputLabels,
                name: apiComponent.name,
                raw: apiComponent,
                base: base
            });

            this.label = base.label;
            this.inputComponents = [];
            this.outputComponents = [];

            CircuitManager.parseCircuit(this.componentBody = apiComponent.component as CircuitObj).then(function (this: StatefulComponent, component: [AvailSync, ComponentMap]) {
                for (const i in component[1]) {
                    if (component[1][i][0].token === '$input' || component[1][i][0].token === '$output') {
                        const isInput = component[1][i][0].token === '$input';
                        const comp = component[1][i][1];

                        const placeholder = new PlaceholderComponent(comp);
                        component[1][i][1] = placeholder;
                        for (const i in comp.inputs)
                            comp.inputs[i][0].outputs[comp.inputs[i][1]][comp.inputs[i][0].outputs[comp.inputs[i][1]].findIndex(i => i[0] === comp)][0] = placeholder;

                        for (const i in comp.outputs)
                            for (const [a, input] of comp.outputs[i].entries())
                                if (input[0] === comp)
                                    comp.outputs[i][a][0] = placeholder;

                        if (isInput)
                            this.inputComponents.push(placeholder);
                        else
                            this.outputComponents.push(placeholder);
                    }
                }
                return this.componentMap = component[1];
            }.bind(this));
        }

        computeOutputs(inputs: boolean[]): boolean[] { // TODO: Evaluate stateful components
            if (!this.componentMap)
                return _.filter((apiComponent.component as CircuitObj).content, i => i.token === '$output').map(i => false);

            for (const [a] of this.inputComponents.entries())
                this.inputComponents[a].output[0] = inputs[a];

            // Update the components separately. We'll get weird behaviour otherwise.
            for (const i of this.inputComponents)
                i.update();

            return _.filter(this.componentMap, i => i[0].token === "$output").map(i => i[1].out[0]);
        }

        preUpdate(next: () => void): void {
            manager.setState().debug.inspectComponent(this, () => next());
        }

    }
}