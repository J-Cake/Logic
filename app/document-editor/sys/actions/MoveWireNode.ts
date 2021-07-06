import {Action, ActionType} from "../Action";
import {State} from "../../State";
import {WireHandle} from "../../ui/output/wire/WireHandle";

export default function MoveWireNode(handle: WireHandle): Action<ActionType.MoveWireNode> {
    let start: [number, number] = handle.gridPos;
    let end: [number, number];

    const syncPos = (state: State) => handle.pos = state.board.gridToPix(handle.gridPos, true);

    return {
        type: ActionType.MoveWireNode,
        performAction(state: State): void {
            handle.parentWire.coords[handle.parentWire.handles.indexOf(handle)] = handle.gridPos = end = state.board.coordsToGrid(handle.pos);
        }, redo(state: State): void {
            handle.parentWire.coords[handle.parentWire.handles.indexOf(handle)] = handle.gridPos = end;
            syncPos(state);
        }, undo(state: State): void {
            handle.parentWire.coords[handle.parentWire.handles.indexOf(handle)] = handle.gridPos = start;
            syncPos(state)
        }
    };
}