import {getColour, HSLToRGB, rgb, RGBToHSL} from '../../sys/util/Colour';
import {manager} from '../../State';
import Colour from '../../sys/util/Themes';
import {map} from '../../sys/util/interpolation';

/**
 * Get or Generate a unique colour for a given component, taking the current theme into account
 * @param token the component's token
 */
export default function getColourForComponent(token?: string): rgb {
    if (!token)
        return getColour(Colour.Blank);

    const components = Object.keys(manager.setState().circuit.state.setState().availableComponents);
    const index = components.indexOf(token);

    const hue = map(index, 0, components.length, 0, 360);
    const blank = RGBToHSL(getColour(Colour.Blank));

    return HSLToRGB([Math.floor(hue), Math.floor(blank[1]), Math.floor(blank[2])]);
}