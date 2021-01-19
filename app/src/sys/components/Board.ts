import * as p5 from 'p5';

import RenderObject from './RenderObject';
import {getColour} from "../util/Colour";
import {Interpolation} from "../util/interpolation";
import {manager} from '../../index';
import {CircuitManagerState} from "../../CircuitManager";
import Colour from "../util/Themes";

export default class Board extends RenderObject {
    padding: number;

    pos: { x: number, y: number };
    size: { w: number, h: number };

    constructor() {
        super(true);

        this.padding = 24;

        this.pos = {
            x: 0,
            y: 0
        };
        this.size = {
            w: 0,
            h: 0
        };

        manager.on("click", async ({mouse}) => {

        });
    }

    getMouseGridCoords(mouse: [number, number]): [number, number] {
        const scl = manager.setState().gridScale;
        return [Math.floor((mouse[0] - this.pos.x) / scl), Math.floor((mouse[1] - this.pos.y) / scl)];
    }

    private drawRulers(sketch: p5) {
        const rulerSize = 7;

        const offset = this.padding + (manager.setState().sidebarIsLeft ? manager.setState().sidebarWidth : 0);
        const scl = manager.setState().gridScale;

        sketch.fill(getColour(Colour.Panel));
        sketch.noStroke();
        sketch.rect(0, 0, sketch.width, rulerSize);

        sketch.strokeWeight(1);
        sketch.stroke(getColour(Colour.Blank));
        for (let i = this.pos.x; i < sketch.width; i += scl)
            sketch.line(i + 0.5, 0, i + 0.5, rulerSize);

        sketch.fill(getColour(Colour.Panel));
        sketch.noStroke();
        sketch.rect(0, 0, rulerSize, sketch.height);

        sketch.strokeWeight(1);
        sketch.stroke(getColour(Colour.Blank));
        for (let j = this.padding; j < sketch.width; j += scl)
            sketch.line(0, j + 0.5, rulerSize, j + 0.5);

        sketch.strokeWeight(1);
        sketch.line(sketch.mouseX + 0.5, 0, sketch.mouseX + 0.5, 1.5 * rulerSize);
        sketch.line(0, sketch.mouseY + 0.5, rulerSize * 1.5, sketch.mouseY + 0.5);
    }

    render(sketch: p5): void {
        sketch.noStroke();
        sketch.fill(getColour(Colour.Panel, {duration: 30, type: Interpolation.linear}));

        const offset = this.padding + (manager.setState().sidebarIsLeft ? manager.setState().sidebarWidth : 0);
        const scl = manager.setState().gridScale;

        sketch.rect(this.pos.x, this.pos.y, this.size.w, this.size.h);

        this.drawRulers(sketch);

        sketch.strokeWeight(1);
        sketch.stroke(getColour(Colour.Background));
        for (let i = this.pos.x; i < this.size.w + this.pos.x; i += scl)
            sketch.line(i + 0.5, this.pos.y, i + 0.5, this.pos.y + this.size.h); // +0.5 makes the lines sharper

        for (let j = this.pos.y; j < this.size.h + this.pos.y; j += scl)
            sketch.line(this.pos.x, j + 0.5, this.pos.x + this.size.w, j + 0.5);

        const managerState: CircuitManagerState = manager.setState().circuit.state.setState();
        if (managerState.document && managerState.document.wires)
            for (const wire of managerState.document.wires) {
                const {board, gridScale} = manager.setState();

                sketch.stroke(getColour(Colour.Blank));
                sketch.strokeWeight(1);
                sketch.beginShape();
                for (const coords of wire)
                    sketch.vertex(board.pos.x + coords[0] * gridScale + gridScale / 2, board.pos.y + coords[1] * gridScale + gridScale / 2 + 0.5);
                sketch.endShape();
            }
    }

    update(sketch: p5): void {
        const state = manager.setState();

        this.size = {
            w: sketch.width - 2 * this.padding - state.componentMenu.outlineSize[0],
            h: sketch.height - 2 * this.padding
        }
        this.pos = {
            x: this.padding + (state.sidebarIsLeft ? state.componentMenu.outlineSize[0] : 0),
            y: this.padding
        }
    }

    reset(): void {

    }

    clean() {

    }
}
