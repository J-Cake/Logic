import {getColour, HSLToRGB, rgb, RGBToHSL} from "../sys/util/Colour";
import {manager} from "../State";
import Colour from "../sys/util/Themes";
import {map} from "../sys/util/interpolation";

/**
 * Get or Generate a unique colour for a given component, taking the current theme into account
 * @param token the component's token
 */
export default function getColourForComponent(token?: string): rgb {
    if (!token)
        return getColour(Colour.Blank);

    const components = Object.keys(manager.setState().circuit.state.setState().availableComponents);
    const index = components.indexOf(token);

    const chaos = (x: number) => x === 0 ? 0 : Math.sin((1 / (x / 100)) * (1 / (1 - x)));
    
    if (index === -1)
        return getColour(Colour.Blank);
    const blank = RGBToHSL(getColour(Colour.Blank));
    return HSLToRGB([map(chaos(map(index, 0, components.length, -1, 1)), -1, 1, 0, 360), blank[1], blank[2]]);
}