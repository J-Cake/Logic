import * as $ from "jquery";
import * as parse from "parse-css-color";
import type {rgb} from "./Colour";

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
    Blank,
    Dark
}

export default Colour;

export enum Theme {
    System,
    DarkBlue,
    DarkRed,
    DarkOrange,
}

export function parseColour(colour: string): rgb {
    return parse((colour || "").slice(1)).values;
}

export function getSystemColours(): Record<Colour, rgb> {
    const container = $(":root");

    return {
        [Colour.Primary]: parseColour(container.css('--primary')),
        [Colour.Danger]: parseColour(container.css('--danger')),
        [Colour.Active]: parseColour(container.css('--active')),
        [Colour.Label]: parseColour(container.css('--label')),
        [Colour.Accent]: parseColour(container.css('--accent')),
        [Colour.SecondaryAccent]: parseColour(container.css('--secondaryaccent')),
        [Colour.Cursor]: parseColour(container.css('--cursor')),
        [Colour.Panel]: parseColour(container.css('--panel')),
        [Colour.Background]: parseColour(container.css('--background')),
        [Colour.Blank]: parseColour(container.css('--blank')),
        [Colour.Dark]: parseColour(container.css('--dark'))
    } as Record<Colour, rgb>;
}

export let system = getSystemColours();

export const themes: Record<Theme, () => Record<Colour, rgb>> = { // Here is a set of predefined colours.
    [Theme.System]: () => {
        return system;
    },
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
        [Colour.Blank]: [0xba, 0xba, 0xba],
        [Colour.Dark]: [0x00, 0x00, 0x00],
    }),
    [Theme.DarkRed]: () => ({
        [Colour.Primary]: [85, 85, 85],
        [Colour.Danger]: [125, 20, 20],
        [Colour.Active]: [224, 44, 83],
        [Colour.Label]: [198, 224, 180],
        [Colour.Accent]: [198, 11, 83],
        [Colour.SecondaryAccent]: [109, 10, 48],
        [Colour.Cursor]: [142, 5, 12],
        [Colour.Panel]: [0, 0, 0],
        [Colour.Background]: [0x25, 0x25, 0x25],
        [Colour.Blank]: [0xba, 0xba, 0xba],
        [Colour.Dark]: [0x00, 0x00, 0x00],
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
        [Colour.Blank]: [0xba, 0xba, 0xba],
        [Colour.Dark]: [0x00, 0x00, 0x00],
    })
}