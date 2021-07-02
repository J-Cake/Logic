import {Action, ActionType} from "../Action";
import {WireHandle} from "../../ui/output/wire/WireHandle";

export default function RemoveWireNode(wireHandle: WireHandle): Action<ActionType.RemoveWireNode> {
    let handle: WireHandle;
    let index: number;
    return {
        type: ActionType.RemoveWireNode,
        performAction(): void {
            handle = wireHandle.parentWire.handles[index = wireHandle.parentWire.handles.indexOf(wireHandle)];
            delete wireHandle.parentWire.handles[index];
        }, redo(): void {
            delete wireHandle.parentWire.handles[index];
        }, undo(): void {
            wireHandle.parentWire.handles[index] = handle;
        }
    };
}