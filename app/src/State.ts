import * as _p5 from "p5";
import * as $ from 'jquery';

import StateManager from "./sys/util/stateManager";
import Board from "./sys/components/Board";
import TooltipPane from "./UI/TooltipPane";
import DragObject from "./sys/components/DragObject";
import DropObject from "./sys/components/DropObject";
import {Theme} from "./sys/util/Themes";
import Cursor from "./UI/cursor";
import CircuitManager from "./Logic/CircuitManager";
import RenderComponent from "./UI/RenderComponent";
import DialogManager, {Dialogs} from "./UI/DialogManager";
import Debugger from "./Logic/Debugger";

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
    font: _p5.Font,
    iconFont: _p5.Font,
    switchFrame: number, // The frame on which the theme was last switched
    frame: number,
    cursor: Cursor,
    circuit: CircuitManager,
    loading: boolean,
    tool: Tool,
    renderedComponents: RenderComponent[],
    canvas: JQuery,
    p5Canvas: _p5.Renderer,
    sidebarWidth: number,
    sidebarIsLeft: boolean,
    gridScale: number,
    actionChain: Partial<State>[],
    dialogManager: StateManager<Dialogs>,
    documentIdentifier: string,
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
    pref: StateManager<{
        showLabels: boolean
    }>
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
    gridScale: 35,
    loading: true,
    sidebarIsLeft: true,
    actionChain: [],
    dialogManager: DialogManager,
    pref: new StateManager<{showLabels: boolean}>({
        showLabels: $("#show-labels").prop("checked")
    })
});