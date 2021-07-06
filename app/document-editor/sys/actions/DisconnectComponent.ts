import Wire from "../../ui/output/wire/Wire";
import {Action, ActionType} from "../Action";
import {State} from "../../State";

export default function DisconnectComponent(hoverWire: [Wire, number]): Action<ActionType.DisconnectComponent> {
    let index: number;
    let wire: Wire;

    return {
        type: ActionType.DisconnectComponent,
        performAction(): void {
            hoverWire[0].endComponent.component.dropInput(hoverWire[0].endComponent.component.inputNames[hoverWire[0].endIndex]);
            wire = hoverWire[0].startComponent.wires[index = hoverWire[0].startComponent.wires.indexOf(hoverWire[0])];
            delete hoverWire[0].startComponent.wires[index];
        }, redo(state: State): void {
            this.performAction(state);
        }, undo(): void {
            hoverWire[0].endComponent.component.addInput(hoverWire[0].startComponent.component,
                hoverWire[0].startComponent.component.outputNames[hoverWire[0].startIndex],
                hoverWire[0].endComponent.component.inputNames[hoverWire[0].endIndex]);
            hoverWire[0].startComponent.wires[index] = wire;
        }
    };
}