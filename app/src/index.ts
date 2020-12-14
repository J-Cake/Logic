import * as _p5 from 'p5';
import * as mousetrap from "mousetrap";

import RenderObject from './sys/components/RenderObject';
import StateManager from "./sys/util/stateManager";
import DragObject from "./sys/components/DragObject";
import DropObject from "./sys/components/DropObject";
import Colour, {getColour, Theme} from "./sys/util/Colour";
import Board from './sys/components/Board';
import {Interpolation} from './sys/util/interpolation';
import Cursor from "./UI/cursor";
import debug, {Debug} from "./Logic/Debug";

declare global {
    interface Array<T> {
        last(i?: number): T;
    }
}
Array.prototype.last = function (i: number = 0) {
    return this[this.length - (Math.max(i, 0) + 1)];
}

export interface State {
    board: Board,
    mouseDown: boolean,
    dragObjects: DragObject[],
    mouse: {
        x: number,
        y: number
    },
    dragStart: {
        x: number,
        y: number
    },
    dropObjects: DropObject[],
    themes: Theme[],
    font: _p5.Font,
    switchFrame: number, // The frame on which the theme was last switched
    frame: number,
    cursor: Cursor,
    debugger: StateManager<Debug>
}

export const manager: StateManager<State> = new StateManager<State>({
    mouseDown: false,
    dragObjects: [],
    dropObjects: [],
    mouse: {x: 0, y: 0},
    dragStart: {x: 0, y: 0},
    themes: [Theme.Dark],
    debugger: debug
});

new _p5(function (sketch: import('p5')) {
    sketch.setup = function () {
        sketch.createCanvas(window.innerWidth, window.innerHeight);

        manager.setState(prev => ({
            board: new Board(),
            font: sketch.loadFont("./font.ttf"),
            switchFrame: 0,
            cursor: new Cursor()
        }));

        sketch.textFont(manager.setState().font);

        window.addEventListener("resize", function () {
            sketch.resizeCanvas(window.innerWidth, window.innerHeight);
        });

        window.addEventListener("click", function () {
            const {dragStart, mouse} = manager.setState();
            if (Math.sqrt((dragStart.x - mouse.x) ** 2 + (dragStart.y - mouse.y) ** 2) <= 5) // Only if there are objects that aren't in a dragging state
                manager.dispatch("click", prev => ({mouse: {x: sketch.mouseX, y: sketch.mouseY}}));
        })

        window.addEventListener("mousedown", function () {
            manager.setState({
                dragStart: {x: sketch.mouseX, y: sketch.mouseY}
            });
        });

        window.addEventListener("mousemove", function () { // Call MouseDown only after traveling a minimum distance
            const {dragStart, mouse} = manager.setState();
            if (Math.sqrt((dragStart.x - mouse.x) ** 2 + (dragStart.y - mouse.y) ** 2) > 5)
                if (!manager.setState().dragObjects.find(i => i.isDragging))
                    manager.dispatch("mouseDown", {
                        mouse
                    });
        });

        window.addEventListener("mouseup", function () {
            manager.dispatch("mouseUp", {
                mouseDown: true
            })
        });

        manager.on("restart", function () {
            manager.setState().board.reset();
            RenderObject.print();
        });

        mousetrap.bind("enter", () => manager.broadcast("enter"));

        manager.broadcast("turnChange");
    }

    sketch.draw = function () {
        sketch.background(getColour(Colour.Background, {duration: 30, type: Interpolation.linear}));

        const state = manager.setState({
            mouse: {
                x: sketch.mouseX,
                y: sketch.mouseY
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
