import * as $ from 'jquery';
import type * as p5 from 'p5';

import RenderObject from "../sys/components/RenderObject";
import {manager} from "../index";
import Colour, {darken, getColour} from "../sys/util/Colour";

export default class ComponentMenu extends RenderObject {

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

            if (manager.setState().sidebarIsLeft)
                sketch.rect(this.pos[0], this.pos[1], this.size[0], this.size[1]);
            else
                sketch.rect(this.pos[0] + manager.setState().board.padding, this.pos[1], this.size[0], this.size[1]);
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