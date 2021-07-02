import {Action, ActionType} from "../Action";
import {manager, Tool} from "../../State";
import RenderComponent from "../../ui/RenderComponent";

export default function AddComponent(component: RenderComponent): Action<ActionType.AddComponent> {
    let index: number;

    return {
        type: ActionType.AddComponent,
        performAction(): void {
            index = manager.setState(prev => ({
                tool: Tool.Move,
                renderedComponents: [...prev.renderedComponents, component]
            })).renderedComponents.length
        },

        undo(): void {
            console.log(manager.setState(prev => ({
                renderedComponents: prev.renderedComponents.slice(0, -1) // we shouldn't run into a problem here, because of the way stacks work.... but idk
            })).renderedComponents);
        },
        redo(): void {
            console.log(manager.setState(prev => ({
                renderedComponents: [...prev.renderedComponents, component]
            })).renderedComponents)
        },
    };
}