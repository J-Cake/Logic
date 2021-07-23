import _ from 'lodash';

import {manager} from "../State";
import {ApiComponent, GenComponent, GenericComponent} from "./io/ComponentFetcher";
import CircuitManager, {AvailSync, ComponentMap} from "./io/CircuitManager";
import {CircuitObj} from "../../../server/App/Document/Document";
import {getComponent} from "../sys/API/component";
import Component from "./Component";

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

export default async function (apiComponent: ApiComponent) {
    return class StatefulComponent extends GenComponent {

        componentBody: CircuitObj;
        componentMap!: ComponentMap;

        private __updated: boolean = false;

        private readonly inputComponents!: (keyof ComponentMap)[];
        private readonly outputComponents!: (keyof ComponentMap)[];

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

            CircuitManager.parseCircuit(this.componentBody = apiComponent.component as CircuitObj).then(
                function (this: StatefulComponent, component: [AvailSync, ComponentMap]) {
                    for (const i in component[1]) {
                        if (component[1][i][0].token === '$input')
                            this.inputComponents.push(Number(i));
                        else if (component[1][i][0].token === '$output')
                            this.outputComponents.push(Number(i));

                        component[1][i][1].update = function (this: GenComponent) {
                            this.out = this.computeOutputs(Object.keys(this.inputs).map(i => this.inputs[i][0].out[this.inputs[i][0].outputNames.indexOf(this.inputs[i][1])]));

                            if (!this.updated) { // Stop the chain, so recursive components don't crash the app
                                this.updated = true;

                                for (const i in this.outputs)
                                    for (const j of this.outputs[i])
                                        j[0].update();
                            }
                        };

                    }
                    return this.componentMap = component[1];
                }.bind(this)
            );
        }

        get updated(): boolean {
            return this.__updated;
        }

        set updated(updated: boolean) {
            this.__updated = updated;

            if (!updated)
                for (const i in this.componentMap)
                    this.componentMap[i][1].updated = false;
        }

        computeOutputs(inputs: boolean[]): boolean[] { // TODO: Evaluate stateful components
            if (!this.componentMap)
                return _.filter((apiComponent.component as CircuitObj).content, i => i.token === '$output').map(i => false);

            for (const [a, i] of this.inputComponents.entries())
                this.componentMap[i][1].addOverride(inputs[a], 0);

            for (const i of this.inputComponents)
                this.componentMap[i][1].update();

            return this.outputComponents.map(i => this.componentMap[i][1].out[0]);
        }

        preUpdate(next: () => void): void {
            manager.setState().debug.inspectComponent(this, () => next());
        }

    }
}