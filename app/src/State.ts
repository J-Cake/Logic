import * as _p5 from "p5";

import StateManager from "./sys/util/stateManager";
import Board from "./sys/components/Board";
import StatefulPreviewPane from "./UI/StatefulPreviewPane";
import DragObject from "./sys/components/DragObject";
import DropObject from "./sys/components/DropObject";
import {Theme} from "./sys/util/Themes";
import Cursor from "./UI/cursor";
import debug, {Debug} from "./Logic/Debug";
import CircuitManager from "./CircuitManager";
import RenderComponent from "./UI/RenderComponent";
import {GenComponent} from "./ComponentFetcher";
import Action from "./Action";
import DialogManager, {Dialogs} from "./UI/DialogManager";

export enum Tool {
    Pointer,
    Select,
    Move,
    Wire,
    Debug
}

export interface State {
    board: Board,
    componentMenu: StatefulPreviewPane,
    mouseDown: boolean,
    dragObjects: DragObject[],
    dropObjects: DropObject[],
    themes: Theme[],
    font: _p5.Font,
    switchFrame: number, // The frame on which the theme was last switched
    frame: number,
    cursor: Cursor,
    debugger: StateManager<Debug>,
    circuit: CircuitManager,
    loading: boolean,
    tool: Tool,
    renderedComponents: RenderComponent<GenComponent>[],
    canvas: JQuery,
    p5Canvas: _p5.Renderer,
    sidebarWidth: number,
    sidebarIsLeft: boolean,
    gridScale: number,
    actionChain: Action[],
    dialogManager: StateManager<Dialogs>,
    documentIdentifier: string,
    mouse: {
        x: number,
        y: number
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
}

export const manager: StateManager<State> = new StateManager<State>({
    mouseDown: false,
    dragObjects: [],
    dropObjects: [],
    mouse: {x: 0, y: 0},
    p_mouse: {x: 0, y: 0},
    dragStart: {x: 0, y: 0},
    themes: [Theme.White],
    debugger: debug,
    gridScale: 35,
    loading: true,
    sidebarIsLeft: true,
    actionChain: [],
    dialogManager: DialogManager
});