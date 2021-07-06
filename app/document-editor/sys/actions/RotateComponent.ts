import {Action, ActionType} from "../Action";
import RenderComponent from "../../ui/RenderComponent";

export default function RotateComponent(component: RenderComponent, direction: 0 | 1 | 2 | 3): Action<ActionType.RotateComponent> {
    const rot = component.props.direction;
    return {
        type: ActionType.RotateComponent,
        performAction(): void {
            component.props.direction = direction;
        }, redo(): void {
            component.props.direction = direction;
        }, undo(): void {
            component.props.direction = rot;
        }
    };
}