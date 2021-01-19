import Colour, {themes} from "../src/sys/util/Themes";
import type StateManager from "../src/sys/util/stateManager";
import type {State} from "./index";
import {rgb} from "../src/sys/util/Colour";

export {rgb, rgba} from '../src/sys/util/Colour';

export default function getColour(this: StateManager<State>, colour: Colour): rgb {
    const colours: Record<Colour, rgb> = themes[this.setState().themes.last()]();
    return colours[colour];
}