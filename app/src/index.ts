import * as $ from 'jquery';
import * as _p5 from 'p5';
import * as mousetrap from "mousetrap";

import RenderObject from './sys/components/RenderObject';
import StateManager from "./sys/util/stateManager";
import DragObject from "./sys/components/DragObject";
import DropObject from "./sys/components/DropObject";
import Board from './sys/components/Board';
import {Interpolation} from './sys/util/interpolation';
import {getColour, rgb} from "./sys/util/Colour";
import Cursor from "./UI/cursor";
import debug, {Debug} from "./Logic/Debug";
import CircuitManager from "./CircuitManager";
import RenderComponent, {renderComponents} from "./UI/RenderComponent";
import {GenComponent} from "./ComponentFetcher";
import handleEvents from "./UI/events";
import StatefulPreviewPane from "./UI/StatefulPreviewPane";
import Action from "./Action";
import Colour, {Theme, themes} from "./sys/util/Themes";
import DialogManager, {Dialogs} from "./UI/DialogManager";
import buildComponentPrompt from "./UI/ComponentLifecycle";

declare global {
    interface Array<T> {
        last(i?: number): T;
    }
}
Array.prototype.last = function (i: number = 0) {
    return this[this.length - (Math.max(i, 0) + 1)];
}

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
    themes: [Theme.DarkRed],
    debugger: debug,
    gridScale: 35,
    loading: true,
    sidebarIsLeft: true,
    actionChain: [],
    dialogManager: DialogManager
});

new _p5(function (sketch: import('p5')) {
    sketch.setup = async function () {
        const root = $(":root");
        const colours: Record<Colour, rgb> = themes[manager.setState().themes.last()]();
        for (const i in colours)
            root.css(`--${Colour[Number(i) as Colour].toLowerCase()}`, `rgb(${getColour(Number(i)).join(', ')})`);

        const documentId: string = $("#circuitToken").text();

        const container = $('#canvas-container');
        $("#status-bar")
            .css('background', `rgb(${getColour(Colour.SecondaryAccent)})`)
            .css('color', `rgb(${getColour(Colour.Background)})`);

        const p5Canvas = sketch.createCanvas(container.width() ?? window.innerWidth, container.height() ?? window.innerHeight);
        p5Canvas.parent(container[0]);

        const {canvas} = manager.setState({
            p5Canvas: p5Canvas,
            canvas: $(p5Canvas.elt)
        });

        handleEvents(canvas, sketch, manager.setState(({
            renderedComponents: await renderComponents(manager.setState(() => ({
                font: sketch.loadFont("/app/font-2.ttf"),
                board: new Board(),
                componentMenu: new StatefulPreviewPane(),
                sidebarWidth: 6,
                switchFrame: 0,
                tool: Tool.Pointer,
                cursor: new Cursor(),
                documentIdentifier: documentId,
                circuit: new CircuitManager(documentId),
                keys: {
                    shift: false,
                    alt: false,
                    ctrl: false,
                    meta: false
                }
            })).circuit)
        })).renderedComponents);

        sketch.textFont(manager.setState().font);

        buildComponentPrompt();
    }

    sketch.draw = function () {
        sketch.background(getColour(Colour.Background, {duration: 30, type: Interpolation.linear}));

        const state = manager.setState({
            mouse: {
                x: sketch.mouseX,
                y: sketch.mouseY
            },
            p_mouse: {
                x: sketch.pmouseX,
                y: sketch.pmouseY
            },
            frame: sketch.frameCount,
            mouseDown: sketch.mouseIsPressed
        });

        const board = manager.setState().board;

        board.render(sketch);
        board.update(sketch);

        RenderObject.tick(sketch);
        RenderObject.draw(sketch);

        state.cursor.render(sketch);
        state.cursor.update(sketch);
    }
});
