import * as p5 from "p5";

import {manager, State} from "../../../State";
import {getColour} from "../../../sys/util/Colour";
import Colour from "../../../sys/util/Themes";
import {WireEditMode} from "../../../Enums";
import mkWire from "./place_wire";
import Wire, {ApiWire} from "./Wire";
import {WireHandle} from "./WireHandle";

export function remove(state: State) {
    const handle = WireHandle.findByCoords([state.mouse.x, state.mouse.y]);

    if (handle) {
        handle[1].onDelete();
        handle[0].handles?.splice(handle[0]?.handles.indexOf(handle[1]), 1);
    } else {
        const hoverWire = Wire.findWireByMouseCoordsByCollision([state.mouse.x, state.mouse.y]);

        if (hoverWire) {
            if (confirm("Delete wire and disconnect components?")) {
                hoverWire[0].startComponent.component.dropInput(hoverWire[0].startComponent.component.inputNames[hoverWire[0].startIndex]);
                hoverWire[0].startComponent.wires.splice(hoverWire[0].startComponent.wires.indexOf(hoverWire[0]), 1);
            }
        }
    }
}

export function initWires() {
    const wire: Partial<ApiWire> = {
        coords: [],
        endComponent: undefined,
        endIndex: undefined,
        startComponent: undefined,
        startIndex: undefined
    }

    manager.setState({
        wirePreview(sketch: p5): void {
            const {board} = manager.setState();

            sketch.stroke(getColour(Colour.SecondaryAccent));
            sketch.strokeWeight(1);
            sketch.noFill();

            sketch.beginShape();

            if (wire.coords)
                for (const [x, y] of wire.coords) {
                    const pos = board.gridToPix([x, y], true);
                    sketch.vertex(Math.floor(pos[0]) + 0.5, Math.floor(pos[1]) + 0.5);
                }

            sketch.endShape();
        }
    });

    const actions: Record<WireEditMode, (state: State, wire: Partial<ApiWire>) => void> = {
        [WireEditMode.Move]: () => void 0,
        [WireEditMode.Place]: (state, wire) => mkWire(state, wire, function () {
            wire.startComponent = undefined;
            wire.endComponent = undefined;
            wire.startIndex = undefined;
            wire.endIndex = undefined;
            wire.coords = [];
        }),
        [WireEditMode.Remove]: state => remove(state),
        [WireEditMode.Select]: () => void 0
    };

    manager.on('wire_click', state => actions[state.wireEditMode](state, wire)); //
}