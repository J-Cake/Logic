import * as p5 from 'p5';

import RenderObject from './RenderObject';
import Colour, {getColour} from "../util/Colour";
import {Interpolation} from "../util/interpolation";
import {manager} from '../../index';

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

    render(sketch: p5): void {
        sketch.noStroke();
        sketch.fill(getColour(Colour.Panel, {duration: 30, type: Interpolation.linear}));

        sketch.rect(this.pos.x, this.pos.y, this.size.w, this.size.h);


    }

    update(sketch: p5): void {
        const dimen = Math.min(sketch.width, sketch.height) - (2 * this.padding);
    }

    reset(): void {

    }

    clean() {

    }
}
