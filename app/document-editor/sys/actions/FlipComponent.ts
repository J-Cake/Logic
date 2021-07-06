import {Action, ActionType} from "../Action";
import RenderComponent from "../../ui/RenderComponent";

export default function FlipComponent(component: RenderComponent): Action<ActionType.FlipComponent> {
    const wasFlipped = component.props.flip;
    return {
        type: ActionType.FlipComponent,
        performAction(): void {
            component.props.flip = !wasFlipped;
        }, redo(): void {
            component.props.flip = !wasFlipped;
        }, undo(): void {
            component.props.flip = wasFlipped;
        }
    };
}