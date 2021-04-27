import {manager} from "../State";
import {ApiComponent, compareArray, GenComponent, GenericComponent, TruthTable} from "./io/ComponentFetcher";

export default function(apiComponent: ApiComponent) {
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
}