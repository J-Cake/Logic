import {manager} from "../State";
import {ApiComponent, compareArray, GenComponent, GenericComponent, TruthTable} from "./io/ComponentFetcher";

export default function (apiComponent: ApiComponent) {
    return class StatelessComponent extends GenComponent {
        constructor(documentComponentKey: number, base: GenericComponent) {
            super({
                documentComponentKey: documentComponentKey,
                inputs: apiComponent.inputLabels,
                outputs: apiComponent.outputLabels,
                name: apiComponent.name,
                raw: apiComponent,
                base: base
            });
            this.update();

            this.label = base.label;
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