import {ApiComponent, GenComponent, GenericComponent} from "./io/ComponentFetcher";
import initPlugin, {Plugin} from "../Plugin/InitPlugin";
import {fetchScript} from "../sys/API/component";
import * as sanitiser from "../Plugin/sanitiser";
import {showModal} from "../Plugin/DialogManager";
import {fetchData, pickFile, saveData} from "../Plugin/API";
import {manager} from "../State";
import RenderComponent from "../ui/RenderComponent";

export default async function (apiComponent: ApiComponent) {
    const source = await fetchScript(apiComponent.component as string);

    return class DynamicComponent extends GenComponent {
        plugin: Partial<Plugin>;

        constructor(documentComponentKey: number, base: GenericComponent) {
            super({
                documentComponentKey: documentComponentKey,
                inputs: apiComponent.inputLabels,
                outputs: apiComponent.outputLabels,
                name: apiComponent.name,
                raw: apiComponent,
                base: base
            });

            this.plugin = {};

            this.label = base.label;

            initPlugin(source, apiComponent, {
                component: {
                    onClick: (callback: (renderObj: sanitiser.SanitisedRenderer) => void) => this.plugin.onClick = callback,
                    setComputeFn: (callback: (inputs: boolean[]) => boolean[]) => this.plugin.computeFn = callback,
                    update: () => this.update(),
                    component: sanitiser.sanitiseComponent(this)
                },
                dialog: {
                    showModal,
                    pickFile
                },
                storage: {
                    saveData,
                    fetchData
                }
            });
        }

        preUpdate(next: () => void): void {
            manager.setState().debug.inspectComponent(this, () => next());
        }

        computeOutputs(inputs: boolean[]): boolean[] {
            // TODO: Offload computation to external script object
            if (this.plugin && this.plugin.computeFn)
                return this.plugin.computeFn(inputs);
            return [];
        }

        activate(renderer: RenderComponent) {
            if (this.plugin.onClick)
                this.plugin.onClick(sanitiser.sanitiseRenderComponent(renderer));
        }
    }
}