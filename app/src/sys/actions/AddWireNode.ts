import Wire from "../../ui/output/wire/Wire";
import {Action, ActionType} from "../Action";
import {WireHandle} from "../../ui/output/wire/WireHandle";
import {State} from "../../State";

export default function AddWireNode(wire: [Wire, number]): Action<ActionType.AddWireNode> {
    let wireNode: WireHandle;
    let index: number;
    let coords: [number, number]

    return {
        type: ActionType.AddWireNode,
        performAction(state: State): void {
            wire[0].coords.splice(wire[1], 0, coords = state.board.coordsToGrid([state.mouse.x, state.mouse.y]));

            if (wire[0].handles)
                // [My little speech](./Wire.ts:62) about Pass-by-reference modification rather than value modification applies here too.
                index = wire[0].handles?.push(wireNode = new WireHandle(wire[0], coords)) - 1;
        }, redo(): void {
            wire[0].coords.splice(wire[1], 0, coords);
            if (wire[0].handles)
                wire[0].handles[index] = wireNode;
        }, undo(): void {
            wire[0].coords.splice(wire[1], 1);
            delete wire[0].handles?.[index];
        }
    };
}