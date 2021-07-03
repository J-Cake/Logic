import {Action, ActionType} from "../Action";
import Wire, {ApiWire} from "../../ui/output/wire/Wire";

export default function ConnectComponent(wire: ApiWire): Action<ActionType.ConnectComponent> {
    const wireCopy = {
        start: wire.startComponent.component,
        end: wire.endComponent.component,
        wires: wire.startComponent.wires,
        startTerminal: wire.startComponent.component.outputNames[wire.startIndex],
        endTerminal: wire.endComponent.component.inputNames[wire.endIndex]
    };
    const displayWire = new Wire(wire);
    let index: number;

    return {
        type: ActionType.ConnectComponent,
        performAction(): void {
            wire.endComponent.component.addInput(
                wire.startComponent.component,
                wire.startComponent.component.outputNames[wire.startIndex],
                wire.endComponent.component.inputNames[wire.endIndex]);
            index = wire.startComponent.wires.push(displayWire) - 1;
        }, redo(): void {
            wire.endComponent.component.addInput(
                wireCopy.start,
                wireCopy.startTerminal,
                wireCopy.endTerminal);
            wireCopy.wires[index] = displayWire;
        }, undo(): void {
            wireCopy.end.dropInput(wireCopy.endTerminal);
            delete wireCopy.wires[index];
        }
    };
}