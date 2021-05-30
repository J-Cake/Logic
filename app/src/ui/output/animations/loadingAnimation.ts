import type p5 from 'p5';
import {Animation} from "../Animation";
import {getColour} from "../../../sys/util/Colour";
import {Colour} from "../../../Enums";

export interface LoadingAnimation extends Animation {
    spinnerSize: number;
}

export const loadingAnimation: LoadingAnimation = {
    duration: 30 as const,
    frame: 0 as const,
    percent: 0 as const,
    repeat: 2 as const,

    spinnerSize: 50,

    // This function is responsible for the loading spinner when documents are opened.
    render(sketch: p5, animation: LoadingAnimation): void {
        sketch.noFill();
        sketch.strokeWeight(6);
        sketch.stroke(getColour(Colour.Primary));
        sketch.strokeCap(sketch.ROUND);

        const start = sketch.map(animation.percent, 0, 1, 0, 2 * Math.PI);
        const end = start + sketch.map(Math.sin(sketch.map(animation.percent, 0, 1, 0, Math.PI/2)), -1, 1, 0.25, 1.75 * Math.PI);

        sketch.arc(sketch.width / 2, sketch.height / 2, animation.spinnerSize, animation.spinnerSize, start, end);
    }
};