import {Action, ActionType} from "../Action";
import RenderComponent from "../../ui/RenderComponent";
import {State} from "../../State";

export default function MoveComponent(comp: RenderComponent): Action<ActionType.MoveComponent> {
    const diff: [[number, number], [number, number]] = [comp.props.pos, [NaN, NaN]];

    const syncPos = (pos: [number, number]) => comp.pos = [(pos[0] + comp.buff), (pos[1] + comp.buff)];
    return {
        type: ActionType.MoveComponent,
        performAction(state: State): void {
            // TODO: Weird bug where when you let the mouse go, sometimes,
            //  the components jump quite far away.
            //  It's much more than a quantisation error...
            //  I have no idea what's causing it.
            comp.props.pos = diff[1] = state.board.coordsToGrid(comp.pos);
        }, redo(state: State): void {
            comp.props.pos = diff[1];
            syncPos(state.board.gridToPix(comp.props.pos));
        }, undo(state: State): void {
            comp.props.pos = diff[0];
            syncPos(state.board.gridToPix(comp.props.pos));
        }
    };
}