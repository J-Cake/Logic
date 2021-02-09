import * as $ from 'jquery';
import type * as p5 from 'p5';

import RenderObject from "../sys/components/RenderObject";
import {manager} from "../index";
import {getColour, lighten} from "../sys/util/Colour";
import Colour from "../sys/util/Themes";

export default class StatefulPreviewPane extends RenderObject {

    pos: [number, number];
    size: [number, number];
    outlineSize: [number, number];

    visibilityToggle: JQuery;

    isVisible: boolean;

    constructor() {
        super(false);
        this.pos = [0, 0];
        this.size = [0, 0];
        this.outlineSize = [0, 0];
        this.visibilityToggle = $("#panel-vis");

        this.isVisible = this.visibilityToggle.is(":checked");
    }

    clean(): void {
    }

    render(sketch: p5): void {
        if (this.isVisible) {
            sketch.fill(getColour(Colour.Panel));
            sketch.noStroke();

            if (manager.setState().sidebarIsLeft)
                sketch.rect(this.pos[0], this.pos[1], this.size[0], this.size[1]);
            else
                sketch.rect(this.pos[0] + manager.setState().board.padding, this.pos[1], this.size[0], this.size[1]);

            const {gridScale, mouse} = manager.setState();

            const components = manager.setState().circuit.state.setState().availableComponents;
            let b: number = 0;

            sketch.textAlign(sketch.LEFT);
            sketch.textSize(gridScale / 2);
            sketch.fill(getColour(Colour.Blank));
            for (const a in components) {
                const coords = [this.pos[0] + gridScale / 4, this.pos[1] + b++ * gridScale + 0.5 + gridScale / 8, this.size[0], gridScale];
                sketch.fill(lighten(Colour.Panel, 25));
                if (mouse.x > coords[0] && mouse.x < coords[0] + coords[2] && mouse.y > coords[1] && mouse.y < coords[1] + coords[3])
                    sketch.rect(coords[0] - gridScale / 4, coords[1] - gridScale / 8 - 1, coords[2], coords[3]);
                sketch.fill(getColour(Colour.Blank));
                sketch.text(a, coords[0], coords[1], coords[2], coords[3]);
            }

        }
    }

    protected update(sketch: p5): void {
        const state = manager.setState();

        this.outlineSize = [this.visibilityToggle.is(":checked") ? (this.size[0] + state.board.padding) : 0, this.size[1]];
        this.pos = [state.sidebarIsLeft ? state.board.padding : state.board.pos.x + state.board.size.w, state.board.pos.y];
        this.size = [state.sidebarWidth * state.gridScale, state.board.size.h];

        this.isVisible = this.visibilityToggle.is(":checked");
    }
}