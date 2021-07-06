import {Action, ActionType} from "../Action";
import {WireHandle} from "../../ui/output/wire/WireHandle";

export default function RemoveWireNode(wireHandles: WireHandle[]): Action<ActionType.RemoveWireNode> {
    let handle: WireHandle[] = [];
    let coords: [number, number][] = [];
    let index: number[] = [];
    return {
        type: ActionType.RemoveWireNode,
        performAction(): void {
            for (const [a, wireHandle] of wireHandles.entries()) {
                handle[a] = wireHandle.parentWire.handles[index[a] = wireHandle.parentWire.handles.indexOf(wireHandle)];
                coords[a] = wireHandle.parentWire.coords[index[a]];
                delete wireHandle.parentWire.coords[index[a]];
                delete wireHandle.parentWire.handles[index[a]];
            }
        }, redo(): void {
            for (const [a, wireHandle] of wireHandles.entries()) {
                delete wireHandle.parentWire.coords[index[a]];
                delete wireHandle.parentWire.handles[index[a]];
            }
        }, undo(): void {
            for (const [a, wireHandle] of wireHandles.entries()) {
                wireHandle.parentWire.handles[index[a]] = handle[a];
                wireHandle.parentWire.coords[index[a]] = coords[a];
            }
        }
    };
}