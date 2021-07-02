import type p5 from 'p5';

import RenderObject from './RenderObject';
import {getColour} from '../util/Colour';
import {manager} from '../../';
import Colour from '../util/Themes';

export default class Board extends RenderObject {
    padding: number;

    pos: { x: number, y: number };
    size: { w: number, h: number };

    boxPos: [number, number];

    translate: [number, number];

    loadTrigger: null | (() => null);

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

        this.translate = [0, 0];
        this.boxPos = [0, 0];

        this.loadTrigger = () => void manager.broadcast('board') ?? null;
    }

    coordsToGrid(mouse: [number, number]): [number, number] {
        const scl = manager.setState().pref.setState().gridSize;
        return [Math.floor((mouse[0] - this.pos.x) / scl), Math.floor((mouse[1] - this.pos.y) / scl)];
    }

    gridToPix(coords: [number, number], centre: boolean = false): [number, number] {
        const mgr = manager.setState()
        const offset = (mgr.sidebarIsLeft && mgr.tooltipPane.isVisible) ? (mgr.tooltipPane.size[0] + this.padding) : 0;

        return [
            Math.floor(mgr.pref.setState().gridSize * coords[0] + this.padding + offset + (centre ? mgr.pref.setState().gridSize * 0.5 : 0)),
            Math.floor(mgr.pref.setState().gridSize * coords[1] + this.padding + (centre ? mgr.pref.setState().gridSize * 0.5 : 0))
        ];
    }

    quantiseCoords(coords: [number, number]): [number, number] {
        const scl = manager.setState().pref.setState().gridSize;
        return [
            Math.floor(coords[0] / scl) * scl + this.pos.x,
            Math.floor(coords[1] / scl) * scl + this.pos.y
        ]
    }

    resetPan() {
        this.translate = [0, 0];
    }

    render(sketch: p5): void {
        sketch.noStroke();

        const {gridSize: scl, showGrid} = manager.setState().pref.setState();

        if (showGrid) {
            sketch.strokeWeight(1);
            sketch.stroke(getColour(Colour.Panel));

            for (let i = 0; i <= sketch.width; i += scl) {
                const x = Math.floor((this.translate[0] + i) - (this.translate[0] - this.pos.x) % scl);
                sketch.line(x, this.translate[1], x, sketch.height + this.translate[1]);
            }

            for (let j = 0; j <= sketch.height; j += scl) {
                const y = Math.floor((this.translate[1] + j) - (this.translate[1] - this.pos.y) % scl);
                sketch.line(this.translate[0], y, sketch.width + this.translate[0], y);
            }
        }
    }

    update(sketch: p5): void {
        const state = manager.setState();

        this.size = {
            w: Math.floor(sketch.width - 2 * this.padding - state.tooltipPane.outlineSize[0]),
            h: Math.floor(sketch.height - 2 * this.padding)
        }
        this.pos = {
            x: Math.floor(this.padding + (state.sidebarIsLeft ? state.tooltipPane.outlineSize[0] : 0)),
            y: Math.floor(this.padding)
        }

        this.boxPos = [Math.floor(this.pos.x + this.translate[0]), Math.floor(this.pos.y + this.translate[1])];

        if (this.loadTrigger)
            this.loadTrigger = this.loadTrigger();
    }

    reset(): void {

    }

    clean() {

    }

    // private drawRulers(sketch: p5) {
    //     const rulerSize = 7;
    //
    //     const offset = this.padding + (manager.setState().sidebarIsLeft ? manager.setState().sidebarWidth : 0);
    //     const scl = manager.setState().pref.setState().gridSize;
    //
    //     sketch.fill(getColour(Colour.Panel));
    //     sketch.noStroke();
    //     sketch.rect(0, 0, sketch.width, rulerSize);
    //
    //     sketch.strokeWeight(1);
    //     sketch.stroke(getColour(Colour.Blank));
    //     for (let i = this.pos.x; i < sketch.width; i += scl)
    //         sketch.line(i + 0.5, 0, i + 0.5, rulerSize);
    //
    //     sketch.fill(getColour(Colour.Panel));
    //     sketch.noStroke();
    //     sketch.rect(0, 0, rulerSize, sketch.height);
    //
    //     sketch.strokeWeight(1);
    //     sketch.stroke(getColour(Colour.Blank));
    //     for (let j = this.padding; j < sketch.width; j += scl)
    //         sketch.line(0, j + 0.5, rulerSize, j + 0.5);
    //
    //     sketch.strokeWeight(1);
    //     sketch.line(sketch.mouseX + 0.5, 0, sketch.mouseX + 0.5, 1.5 * rulerSize);
    //     sketch.line(0, sketch.mouseY + 0.5, rulerSize * 1.5, sketch.mouseY + 0.5);
    // }
}
