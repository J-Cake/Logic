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
            wireCopy.end.addInput(
                wireCopy.start,
                wireCopy.startTerminal,
                wireCopy.endTerminal);
            displayWire.doRender = true;
        }, undo(): void {
            wireCopy.end.dropInput(wireCopy.endTerminal);
            displayWire.doRender = false // Yay workarounds
            // Why tf does the `wire` object contain only `undefined`s? That's pretty whacky
        }
    };
}