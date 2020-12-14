import * as p5 from "p5";
import RenderObject from "../sys/components/RenderObject";
import {manager} from "../index";
import Colour, {getColour, transparent} from "../sys/util/Colour";

export default class Cursor extends RenderObject {
    public constructor() {
        super(true);

        manager.on('mouseup', function(state) {

        });
    }

    render(sketch: p5): void {
        const state = manager.setState();
        if (state.mouseDown && state.dragObjects.length === 0) {
            sketch.fill(transparent(Colour.Cursor, 120));
            sketch.stroke(getColour(Colour.Cursor));
            sketch.strokeWeight(1);
            sketch.rect(
                Math.min(state.dragStart.x, state.mouse.x),
                Math.min(state.dragStart.y, state.mouse.y),
                Math.abs(Math.max(state.dragStart.x, state.mouse.x) - Math.min(state.dragStart.x, state.mouse.x)),
                Math.abs(Math.max(state.dragStart.y, state.mouse.y) - Math.min(state.dragStart.y, state.mouse.y)));
        }
    }

    update(sketch: p5): void {

    }

    clean(): void {
    }
}