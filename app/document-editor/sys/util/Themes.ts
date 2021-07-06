import $ from 'jquery';
import parse from 'parse-css-color';
import type {rgb} from './Colour';

import {Colour, Theme} from '../../Enums';
import {manager} from '../../State';

export {Theme} from '../../Enums';
export default Colour;

export function parseColour(colour: string): rgb {
    return parse((colour || "").slice(1))?.values ?? [0, 0, 0];
}

export function getSystemColours(): Record<Colour, rgb> {
    const container = $(":root");

    return {
        [Colour.Primary]: parseColour(container.css('--primary')),
        [Colour.Danger]: parseColour(container.css('--danger')),
        [Colour.Active]: parseColour(container.css('--active')),
        [Colour.Label]: parseColour(container.css('--label')),
        [Colour.Accent]: parseColour(container.css('--accent')),
        [Colour.Secondary]: parseColour(container.css('--secondary')),
        [Colour.SecondaryAccent]: parseColour(container.css('--secondaryaccent')),
        [Colour.Cursor]: parseColour(container.css('--cursor')),
        [Colour.Panel]: parseColour(container.css('--panel')),
        [Colour.Background]: parseColour(container.css('--background')),
        [Colour.Blank]: parseColour(container.css('--blank')),
        [Colour.Dark]: parseColour(container.css('--dark'))
    } as Record<Colour, rgb>;
}

export let system = getSystemColours();
window.matchMedia(`(prefers-color-scheme: dark)`)
    .addEventListener('change', () => new Promise(k => k(system = getSystemColours()))
        .then(() => manager.broadcast('tick')));

manager.on('init', function (prev) {
    const theme = prev.pref.setState().theme;
    if (typeof theme === 'number')
        manager.setState({theme: theme});
    new Promise(k => k(null)).then(() => manager.broadcast('tick'));
});

export const themes: Record<Theme, () => Record<Colour, rgb>> = { // Here is a set of predefined colours.

    // Removing themes all-together from the application will not necessarily break it,
    // as colours are applied based on parsed CSS values, however, removing them is a huge task,
    // as they are fundamental to the project template.

    [Theme.System]: () => system,
    [Theme.Dark]: () => system,
    [Theme.Light]: () => system,
    [Theme.DarkBlue]: () => system,
    [Theme.DarkRed]: () => system,
    [Theme.DarkOrange]: () => system
}