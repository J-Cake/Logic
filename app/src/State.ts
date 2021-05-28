import type p5 from 'p5';

import StateManager from './sys/util/stateManager';
import Board from './sys/components/Board';
import TooltipPane from './ui/output/TooltipPane';
import DragObject from './sys/components/DragObject';
import DropObject from './sys/components/DropObject';
import {Animation} from "./ui/output/Animation";
import Cursor from './ui/output/cursor';
import CircuitManager from './Logic/io/CircuitManager';
import RenderComponent from './ui/RenderComponent';
import DialogManager, {Dialogs} from './menus/DialogManager';
import Debugger from './Logic/Debugger';
import PreferenceManager from './PreferenceManager';
import {defaultPreferences, Theme, WireEditMode} from './Enums';

export enum Tool {
    Pointer,
    Select,
    Move,
    Wire,
    Debug,
    Label,
}

export interface State {
    board: Board,
    debug: Debugger,
    tooltipPane: TooltipPane,
    mouseDown: boolean,
    dragObjects: DragObject[],
    dropObjects: DropObject[],
    theme: Theme,
    font: p5.Font,
    iconFont: p5.Font,
    switchFrame: number, // The frame on which the theme was last switched
    frame: number,
    ready: boolean,
    cursor: Cursor,
    circuit: CircuitManager,
    tool: Tool,
    renderedComponents: RenderComponent[],
    canvas: JQuery,
    p5Canvas: p5.Renderer,
    sidebarWidth: number,
    sidebarIsLeft: boolean,
    pan: [number, number],
    scale: number,
    actionChain: Partial<State>[],
    dialogManager: StateManager<Dialogs>,
    documentIdentifier: string,
    wireEditMode: WireEditMode,
    wirePreview: (sketch: import('p5')) => void,
    mouse: {
        x: number,
        y: number,
        pressed: boolean
    },
    p_mouse: {
        x: number,
        y: number
    },
    dragStart: {
        x: number,
        y: number
    },
    keys: {
        shift: boolean,
        alt: boolean,
        ctrl: boolean,
        meta: boolean
    },
    pref: PreferenceManager
}

export const manager: StateManager<State> = new StateManager<State>({
    mouseDown: false,
    debug: new Debugger(),
    dragObjects: [],
    dropObjects: [],
    mouse: {x: 0, y: 0, pressed: false},
    p_mouse: {x: 0, y: 0},
    dragStart: {x: 0, y: 0},
    theme: Theme.System,
    pan: [0, 0],
    scale: 1,
    ready: false,
    sidebarIsLeft: true,
    actionChain: [],
    dialogManager: DialogManager,
    pref: new PreferenceManager(defaultPreferences),
    wireEditMode: WireEditMode.Move
});