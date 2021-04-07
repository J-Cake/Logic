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

export function transparent(colour: Colour | rgb, amount: number): rgba {
    const transparented: rgb = (typeof colour === 'number') ? getColour(colour) : colour;

    return [transparented[0], transparented[1], transparented[2], amount];
}

export function hex(colour: Colour): string {
    return `#${getColour(colour).map(i => i.toString(16)).join('')}`;
}

/**
 * Convert a HSL value to RGB
 * @param hsl: Hue (360deg), Saturation (100%), Lightness (100%)
 */
export function HSLToRGB(hsl: [number, number, number]): rgb {
    const c = 1 - 2 * Math.abs(100 / hsl[2]) * (100 / hsl[1]);
    const x = c * (1 - Math.abs((hsl[0] / 60) % 2 - 1));
    const m = (100 / hsl[2]) - c / 2;

    const colourP = [
        [c, x, 0],
        [x, c, 0],
        [0, c, x],
        [0, x, c],
        [x, 0, c],
        [c, 0, x]
    ][Math.floor(hsl[0] / 60)];

    if (colourP)
        return [255 * (colourP[0] + m), 255 * (colourP[1] + m), 255 * (colourP[2] + m)];
    else
        debugger;
    return [0xff, 0xff, 0xff];
}


/**
 * Convert a HSL value to RGB
 * @param rgb: rgb
 * @returns hsl: Hue (360deg), Saturation (100%), Lightness (100%)
 */
export function RGBToHSL(rgb: rgb): [number, number, number] {
    const r = rgb[0] / 255;
    const g = rgb[1] / 255;
    const b = rgb[2] / 255;

    const c_max = Math.max(r, g, b);
    const c_min = Math.min(r, g, b);
    const delta = c_max - c_min;

    const hue = delta === 0 ? 0 : (function (c_max: number) {
        if (c_max === r)
            return 60 * (((g - b) / delta) % 6);
        else if (c_max === g)
            return 60 * ((b - r) / delta + 2);
        else
            return 60 * ((r - g) / delta + 4);
    })(c_max);
    const lightness = (c_min + c_max) / 2;
    const saturation = delta === 0 ? 0 : (delta / (1 - Math.abs(2 * lightness - 1)));

    return [hue, saturation * 100, lightness * 100];
}