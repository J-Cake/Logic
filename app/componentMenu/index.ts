import * as $ from 'jquery';
import * as Mousetrap from 'mousetrap';

import StateManager from "../src/sys/util/stateManager";
import getColour, {rgb} from "./colourLib";
import Colour from "../src/sys/util/Themes";

declare global {
    interface Window {
        stateManager: StateManager<any>;
        init: (state: Partial<State>) => void
    }

    interface Array<T> {
        last(i?: number): T;
    }
}
Array.prototype.last = function (i: number = 0) {
    return this[this.length - (Math.max(i, 0) + 1)];
}

export interface State {
    theme: Record<Colour, rgb>,
    onSelect: (id: string) => void
}

const manager = window.stateManager = new StateManager<State>({});

export default manager;
export const mousetrap = new Mousetrap();

window.init = (state: Partial<State>) => {
    window.stateManager = new StateManager<State>(state);
    $("span.name").on('click', e => state.onSelect ? state.onSelect(e.target.innerText) : null);
    loadColours((window.stateManager.setState() as State).theme);
};

mousetrap.bind('esc', () => window.close());

loadColours((window.stateManager.setState() as State).theme);
export function loadColours(theme: Record<Colour, rgb>) {
    console.log(window.stateManager.setState().themes);
    const root = $(":root");
    for (const i in theme)
        root.css(`--${Colour[Number(i) as Colour].toLowerCase()}`, `rgb(${getColour.bind(window.stateManager)(Number(i)).join(', ')})`);
}