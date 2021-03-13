import * as $ from 'jquery';
import '../prompt';

import Colour from "../../src/sys/util/Themes";
import {rgb} from "../../src/sys/util/Colour";
import StateManager from "../../src/sys/util/stateManager";
import {connect} from "../prompt";

export interface State {
    theme: Record<Colour, rgb>,
    onSelect: (id: string) => void
}

export const manager = window.stateManager = new StateManager<State>({});

$("#find-component").on("click", () => window.dispatchEvent(new CustomEvent('open-finder')));

connect((state: State) => $("span.name").on('click', e => state.onSelect ? state.onSelect(e.target.innerText) : null));