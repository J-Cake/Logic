import {Action, ActionType} from "../Action";
import Wire, {ApiWire} from "../../ui/output/wire/Wire";

export default function ConnectComponent(wire: ApiWire): Action<ActionType.ConnectComponent> {
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
                wire.startComponent.component,
                wire.startComponent.component.outputNames[wire.startIndex],
                wire.endComponent.component.inputNames[wire.endIndex]);
            wire.startComponent.wires[index] = displayWire;
        }, undo(): void {
            wire.endComponent.component.dropInput(wire.endComponent.component.inputNames[wire.endIndex]);
            delete wire.startComponent.wires[index];
        }
    };
}