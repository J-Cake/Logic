import * as p5 from "p5";
import RenderObject from "../sys/components/RenderObject";
import {manager} from "../index";
import Colour, {getColour, transparent} from "../sys/util/Colour";

export default class Cursor extends RenderObject {

    pos: [number, number];
    size: [number, number];

    public constructor() {
        super(true);

        this.pos = [0, 0];
        this.size = [0, 0];

        manager.on('mouseUp', state => state.renderedComponents.forEach(i => {
            if (i.pos[0] + i.size[0] >= this.pos[0] && i.pos[0] <= this.pos[0] + this.size[0] &&
                i.pos[1] + i.size[1] >= this.pos[1] && i.pos[1] <= this.pos[1] + this.size[1])
                i.isSelected = true;
            else if (!state.keys.shift)
                i.isSelected = false;
        }));
    }

    getDistance(): number {
        const state = manager.setState();
        return Math.sqrt((state.dragStart.x - state.mouse.x) ** 2 + (state.dragStart.y - state.mouse.y) ** 2);
    }

    render(sketch: p5): void {
        const state = manager.setState();
        if (state.mouseDown && state.dragObjects.length === 0 && this.getDistance() > 10) {
            sketch.fill(transparent(Colour.Cursor, 60));
            sketch.stroke(getColour(Colour.Cursor));
            sketch.strokeWeight(1);
            sketch.rect(this.pos[0], this.pos[1], this.size[0], this.size[1]);
        }
    }

    update(sketch: p5): void {
        const state = manager.setState();
        this.pos = [Math.min(state.dragStart.x, state.mouse.x) + 0.5, Math.min(state.dragStart.y, state.mouse.y) + 0.5];
        this.size = [Math.abs(Math.max(state.dragStart.x, state.mouse.x) - Math.min(state.dragStart.x, state.mouse.x)),
            Math.abs(Math.max(state.dragStart.y, state.mouse.y) - Math.min(state.dragStart.y, state.mouse.y))];
    }

    clean(): void {
    }
}