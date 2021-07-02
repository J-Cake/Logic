import {Action, ActionType} from "../Action";
import RenderComponent from "../../ui/RenderComponent";

export default function ChangeLabel(component: RenderComponent, label: string): Action<ActionType.ChangeLabel> {
    const original = component.component.label;
    return {
        type: ActionType.ChangeLabel,
        performAction(): void {
            component.component.label = label;
        }, redo(): void {
            component.component.label = label;
        }, undo(): void {
            component.component.label = original;
        }
    };
}