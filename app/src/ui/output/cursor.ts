import * as p5 from "p5";

import RenderObject from "../../sys/components/RenderObject";
import {manager, Tool} from "../../index";
import {getColour, transparent} from "../../sys/util/Colour";
import Colour from "../../sys/util/Themes";

export default class Cursor extends RenderObject {

    pos: [number, number];
    size: [number, number];

    public constructor() {
        super(true);

        this.pos = [0, 0];
        this.size = [0, 0];

        manager.on('mouseUp', prev => prev.renderedComponents.forEach(i => {
            if (prev.tool === Tool.Select && this.getDistance() > 10) {
                if (i.pos[0] + i.size[0] >= this.pos[0] && i.pos[0] <= this.pos[0] + this.size[0] &&
                    i.pos[1] + i.size[1] >= this.pos[1] && i.pos[1] <= this.pos[1] + this.size[1])
                    i.isSelected = true;
                else if (!prev.keys.shift)
                    i.isSelected = false;

                i.wires.forEach(i => i.handles?.forEach(i => {
                    if (i.pos.x >= this.pos[0] && i.pos.x <= this.pos[0] + this.size[0] && i.pos.y >= this.pos[1] && i.pos.y <= this.pos[1] + this.size[1])
                        console.log(i.isSelected = true, i);
                    else if (!prev.keys.shift)
                        i.isSelected = false;
                }));
            }
        }));
    }

    getDistance(): number {
        const state = manager.setState();
        return Math.sqrt((state.dragStart.x - state.mouse.x) ** 2 + (state.dragStart.y - state.mouse.y) ** 2);
    }

    render(sketch: p5): void {
        const state = manager.setState();
        if (state.tool === Tool.Select)
            if (state.mouse.pressed && this.getDistance() > 10) { // we don't need to check for drag objects because the select tool does not drag objects
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