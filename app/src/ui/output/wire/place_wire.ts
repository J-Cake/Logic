import Wire, {ApiWire} from "./Wire";
import {State} from "../../../State";
import {WireHandle} from "./WireHandle";

export const xor = (a: boolean, b: boolean): boolean => !(a && b) && (a || b);

export default function mkWire(state: State, wire: Partial<ApiWire>, clearWire: () => void) {
    const hoverComponent = state.renderedComponents.find(i => i.getTouchingTerminal([state.mouse.x, state.mouse.y])); // i.isWithinBounds(state)

    if (hoverComponent || wire.startComponent || wire.endComponent) {
        if (hoverComponent) {
            // isInput, terminalIndex. I wanted to destructure it, but I had to null-check it.
            const terminal = hoverComponent.getTouchingTerminal([state.mouse.x, state.mouse.y]);
            if (terminal) {
                if (!terminal[0]) {
                    wire.endComponent = hoverComponent;
                    wire.endIndex = terminal[1];
                } else {
                    wire.startComponent = hoverComponent;
                    wire.startIndex = terminal[1];
                }

                const connect = function (wire: ApiWire) {
                    wire.endComponent.component.addInput(
                        wire.startComponent.component,
                        wire.startComponent.component.outputNames[wire.startIndex],
                        wire.endComponent.component.inputNames[wire.endIndex]);
                    wire.startComponent.wires.push(new Wire(wire as ApiWire));
                }

                if (wire.startComponent && wire.endComponent && typeof wire.startIndex === 'number' && typeof wire.endIndex === 'number') {
                    if (wire.endComponent.component.inputs[wire.endComponent.component.inputNames[wire.endIndex]]) {
                        if (confirm('There is already a connection here. Do you want to overwrite it?')) {
                            wire.endComponent.component.dropInput(wire.endComponent.component.inputNames[wire.endIndex]);
                            const wire_to_delete = wire.startComponent.wires.findIndex(i => i.endComponent === wire.endComponent);
                            if (wire_to_delete > -1)
                                wire.startComponent.wires.splice(wire_to_delete, 1);

                            connect(wire as Wire);
                        }
                    } else
                        connect(wire as Wire);

                    wire.startComponent.component.update();
                    clearWire();
                }
            }
        } else if (wire.startComponent || wire.endComponent) {
            if (wire.coords)
                if (wire.endComponent) // Push items to the list in reverse
                    wire.coords?.unshift(state.board.coordsToGrid([state.mouse.x, state.mouse.y]));
                else
                    wire.coords?.push(state.board.coordsToGrid([state.mouse.x, state.mouse.y]));
            else
                wire.coords = [state.board.coordsToGrid([state.mouse.x, state.mouse.y])];
        }
    } else {
        const wire = Wire.findWireByMouseCoordsByCollision([state.mouse.x, state.mouse.y]);

        if (wire) {
            const coords = state.board.coordsToGrid([state.mouse.x, state.mouse.y]);
            wire[0].coords.splice(wire[1], 0, coords);

            // [My little speech](./Wire.ts:62) about Pass-by-reference modification rather than value modification applies here too.
            wire[0].handles?.push(new WireHandle(
                state.board.gridToPix(coords, true),
                _coords => (coords[0] = _coords[0],coords[1] = _coords[1]),
                () => wire[0].coords.splice(wire[0].coords.indexOf(coords), 1)
            ));
        }
    }
}