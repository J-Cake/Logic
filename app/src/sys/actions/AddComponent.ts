import {Action, ActionType} from "../Action";
import {manager, Tool} from "../../State";
import RenderComponent from "../../ui/RenderComponent";

export default function AddComponent(component: RenderComponent): Action<ActionType.AddComponent> {
    let index: number;

    return {
        type: ActionType.AddComponent,
        performAction(state): void {
            index = manager.setState(prev => ({
                tool: Tool.Move,
                renderedComponents: [...prev.renderedComponents, component]
            })).renderedComponents.length;

            state.circuit.state.setState(prev => ({
                components: [...prev.components, component.component]
            }))
        },

        undo(): void {
            manager.setState(function (prev) {
                const comps = prev.renderedComponents;
                index = comps.indexOf(component);
                delete comps[index];

                return {
                    renderedComponents: comps
                };
            });
        },
        redo(): void {
            manager.setState(function (prev) {
                const comps = prev.renderedComponents;
                if (!comps[index])
                    comps[index] = component;
                else
                    comps.push(component)

                console.log(component);

                return {
                    renderedComponents: comps
                };
            });
        },
    };
}