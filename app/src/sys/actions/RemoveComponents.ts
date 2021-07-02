import {Action, ActionType} from "../Action";
import RenderComponent from "../../ui/RenderComponent";
import {manager} from "../../State";

export default function RemoveComponents(components: RenderComponent[]): Action<ActionType.RemoveComponents> {

    // const connections = components.map(i => [i.component.inputs, i.component.outputs]);

    return {
        type: ActionType.RemoveComponents,
        performAction(): void {
            for (const i of components) {
                i.component.dropAll(); // @ts-ignore
                i.deleted = delete i.component;
            }
            manager.setState(prev => ({renderedComponents: prev.renderedComponents.filter(i => i.component)}));
        }, redo(): void {
        }, undo(): void {
        }
    };
}