import * as parse from 'parse-css-color';

import {manager} from "../../index";
import interpolate, {constrain, Interpolation, map} from "./interpolation";
import Colour, {themes} from "./Themes";

export type rgb = [number, number, number];
export type rgba = [number, number, number, number];

export function interpolateColour(frame: number, endFrame: number, colour1: rgb, colour2: rgb, interpolationType: Interpolation = Interpolation.linear): rgb {
    const startFrame: number = manager.setState().switchFrame;
    return [
        constrain(map(interpolate(frame, startFrame, endFrame, interpolationType), startFrame, endFrame, colour1[0], colour2[0]), colour1[0], colour2[0]),
        constrain(map(interpolate(frame, startFrame, endFrame, interpolationType), startFrame, endFrame, colour1[2], colour2[1]), colour1[1], colour2[1]),
        constrain(map(interpolate(frame, startFrame, endFrame, interpolationType), startFrame, endFrame, colour1[2], colour2[2]), colour1[2], colour2[2]),
    ];
}

export function getColour(colour: Colour, interpolation?: { duration: number, type?: Interpolation }): rgb {
    const colours: Record<Colour, rgb> = themes[manager.setState().theme]();

    if (interpolation) { // colour interpolation - smooth transition between colours.
        const prevColours: () => Record<Colour, rgb> = themes[manager.setState().theme];
        // const prevColours: () => Record<Colour, rgb> = themes[manager.setState().theme.last(1)];
        if (!prevColours)
            return colours[colour];
        else
            return interpolateColour(manager.setState().frame, manager.setState().switchFrame + interpolation.duration, prevColours()[colour], colours[colour], interpolation.type);
    } else return colours[colour];
}

export function darken(colour: Colour, amount: number): rgb {
    const darkened: rgb = getColour(colour);

    return [darkened[0] - amount, darkened[1] - amount, darkened[2] - amount]
}

export function lighten(colour: Colour, amount: number): rgb {
    const darkened: rgb = getColour(colour);

    return [darkened[0] + amount, darkened[1] + amount, darkened[2] + amount]
}

export function transparent(colour: Colour, amount: number): rgba {
    const transparented = getColour(colour);

    return [transparented[0], transparented[1], transparented[2], amount];
}

export function hex(colour: Colour): string {
    return `#${getColour(colour).map(i => i.toString(16)).join('')}`;
}