import {manager} from "../../index";
import {Interpolation, map, constrain} from "./interpolation";
import interpolate from "./interpolation";

enum Colour {
    Primary,
    Danger,
    Active,
    Label,
    Accent,
    SecondaryAccent,
    Cursor,
    Panel,
    Background,
    Blank
}

export default Colour;

export enum Theme {
    White,
    DarkBlue,
    DarkRed,
    DarkOrange,
}

export const themes: Record<Theme, () => Record<Colour, [number, number, number]>> = { // Here is a set of predefined colours.
    [Theme.White]: () => ({
        [Colour.Primary]: [217, 217, 217],
        [Colour.Danger]: [248, 203, 173],
        [Colour.Active]: [255, 230, 153],
        [Colour.Label]: [198, 224, 180],
        [Colour.Accent]: [142, 169, 219],
        [Colour.SecondaryAccent]: [91, 155, 213],
        [Colour.Cursor]: [142, 169, 219],
        [Colour.Panel]: [217, 217, 217],
        [Colour.Background]: [255, 255, 255],
        [Colour.Blank]: [60, 65, 70]
    }),
    [Theme.DarkBlue]: () => ({
        [Colour.Primary]: [85, 85, 85],
        [Colour.Danger]: [125, 20, 20],
        [Colour.Active]: [14, 92, 175],
        [Colour.Label]: [198, 224, 180],
        [Colour.Accent]: [142, 169, 219],
        [Colour.SecondaryAccent]: [91, 155, 213],
        [Colour.Cursor]: [142, 169, 219],
        [Colour.Panel]: [0, 0, 0],
        [Colour.Background]: [0x25, 0x25, 0x25],
        [Colour.Blank]: [0xba, 0xba, 0xba]
    }),
    [Theme.DarkRed]: () => ({
        [Colour.Primary]: [85, 85, 85],
        [Colour.Danger]: [125, 20, 20],
        [Colour.Active]: [142, 44, 49],
        [Colour.Label]: [198, 224, 180],
        [Colour.Accent]: [198, 11, 83],
        [Colour.SecondaryAccent]: [109, 10, 48],
        [Colour.Cursor]: [142, 5, 12],
        [Colour.Panel]: [0, 0, 0],
        [Colour.Background]: [0x25, 0x25, 0x25],
        [Colour.Blank]: [0xba, 0xba, 0xba]
    }),
    [Theme.DarkOrange]: () => ({
        [Colour.Primary]: [85, 85, 85],
        [Colour.Danger]: [125, 20, 20],
        [Colour.Active]: [142, 44, 49],
        [Colour.Label]: [198, 224, 180],
        [Colour.Accent]: [198, 11, 83],
        [Colour.SecondaryAccent]: [109, 10, 48],
        [Colour.Cursor]: [0x8e, 0x58, 0x2c],
        [Colour.Panel]: [0, 0, 0],
        [Colour.Background]: [0x25, 0x25, 0x25],
        [Colour.Blank]: [0xba, 0xba, 0xba]
    })
}

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
    const colours: Record<Colour, rgb> = themes[manager.setState().themes.last()]();

    if (interpolation) { // colour interpolation - smooth transition between colours.
        const prevColours: () => Record<Colour, rgb> = themes[manager.setState().themes.last(1)];
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