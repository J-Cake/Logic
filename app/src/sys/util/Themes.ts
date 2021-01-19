import {rgb} from "./Colour";

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

export const themes: Record<Theme, () => Record<Colour, rgb>> = { // Here is a set of predefined colours.
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
        [Colour.Active]: [224, 44, 83],
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