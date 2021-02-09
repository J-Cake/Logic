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
    Black,
    DarkBlue,
    DarkRed,
    DarkOrange,
}

export const themes: Record<Theme, () => Record<Colour, rgb>> = { // Here is a set of predefined colours.
    [Theme.White]: () => ({
        [Colour.Primary]: [217, 217, 217],
        [Colour.Danger]: [248, 203, 173],
        [Colour.Active]: [239, 166, 239],
        [Colour.Label]: [40, 179, 118],
        [Colour.Accent]: [142, 169, 219],
        [Colour.SecondaryAccent]: [255, 230, 153],
        [Colour.Cursor]: [142, 169, 219],
        [Colour.Panel]: [0xEF, 0xEF, 0xEF],
        [Colour.Background]: [255, 255, 255],
        [Colour.Blank]: [60, 65, 70]
    }),
    [Theme.Black]: () => ({
        [Colour.Primary]: [0xce, 0xc9, 0xc4],
        [Colour.Danger]: [0x4c, 0x3a, 0x33],
        [Colour.Active]: [0xa8, 0x44, 0x01],
        [Colour.Label]: [0x0c, 0xb3, 0xc9],
        [Colour.Accent]: [0x28, 0x33, 0x4c],
        [Colour.SecondaryAccent]: [0x41, 0x9b, 0x62],
        [Colour.Cursor]: [0xba, 0x09, 0x50],
        [Colour.Panel]: [0x2f, 0x33, 0x34],
        [Colour.Background]: [0x15, 0x1b, 0x1c],
        [Colour.Blank]: [0xc3, 0xc3, 0xc8],
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