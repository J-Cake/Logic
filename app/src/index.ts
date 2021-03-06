import * as $ from 'jquery';
import * as _p5 from 'p5';
import * as mousetrap from 'mousetrap';
import * as eva from 'eva-icons';

import {manager, Tool} from './State';
import RenderObject from './sys/components/RenderObject';
import Board from './sys/components/Board';
import {Interpolation} from './sys/util/interpolation';
import {getColour, hex} from "./sys/util/Colour";
import Cursor from "./UI/cursor";
import CircuitManager from "./Logic/CircuitManager";
import {renderComponents} from "./UI/RenderComponent";
import handleEvents from "./UI/events";
import TooltipPane from "./UI/TooltipPane";
import Colour from "./sys/util/Themes";
import buildComponentPrompt from "./UI/ComponentMenu";
import buildFinderPrompt from "./UI/ComponentFinder";
// import {mousetrap} from "../window/componentMenu";

declare global {
    interface Array<T> {
        last(i?: number): T;
    }
}
Array.prototype.last = function (i: number = 0) {
    return this[this.length - (Math.max(i, 0) + 1)];
}

export * from './State';

new _p5(function (sketch: _p5) {

    let scl: number;
    let pan: [number, number] = [0, 0];

    sketch.setup = async function () {
        // const root = $(":root");
        // const colours: Record<Colour, rgb> = themes[manager.setState().theme]();
        // for (const i in colours)
        //     root.css(`--${Colour[Number(i) as Colour].toLowerCase()}`, `rgb(${getColour(Number(i)).join(', ')})`);

        const documentId: string = $("#circuitToken").text();

        const container = $('#canvas-container');

        const p5Canvas = sketch.createCanvas(container.width() ?? window.innerWidth, container.height() ?? window.innerHeight);
        p5Canvas.parent(container[0]);

        const {canvas} = manager.setState({
            p5Canvas: p5Canvas,
            canvas: $(p5Canvas.elt)
        });

        handleEvents(canvas, sketch, manager.setState(({
            renderedComponents: await renderComponents(manager.setState(() => ({
                font: sketch.loadFont("/app/font-2.ttf"),
                // iconFont: sketch.loadFont("/app/remixicon.ttf"),
                iconFont: sketch.loadFont('/app/segoe-mdl2.ttf'),
                board: new Board(),
                tooltipPane: new TooltipPane(),
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

        $("#canvas-container").on('wheel', function (e) {
            const event: WheelEvent = e.originalEvent as WheelEvent;

            if (manager.setState().keys.shift) {
                pan[0] -= event.deltaY;
                pan[1] -= event.deltaX;
            } else {
                pan[0] -= event.deltaX;
                pan[1] -= event.deltaY;
            }
            e.preventDefault();
        });

        mousetrap.bind('alt+s', () => pan = [0, 0]);

        buildComponentPrompt();
        buildFinderPrompt();

        eva.replace({
            fill: hex(Colour.Blank)
        })
    }

    sketch.draw = async function () {
        $("#debug-container input").prop("disabled", true);

        sketch.translate(pan[0], pan[1]);
        sketch.background(getColour(Colour.Background, {duration: 30, type: Interpolation.linear}));

        const state = manager.setState(prev => ({
            mouse: {
                x: sketch.mouseX + prev.board.translate[0],
                y: sketch.mouseY + prev.board.translate[1],
                pressed: sketch.mouseIsPressed
            },
            p_mouse: {
                x: sketch.pmouseX + prev.board.translate[0],
                y: sketch.pmouseY + prev.board.translate[1]
            },
            frame: sketch.frameCount,
            mouseDown: sketch.mouseIsPressed
        }));

        const board = manager.setState().board;
        board.translate = [-pan[0], -pan[1]];

        $("span#grid-pos").text(`${board.coordsToGrid([state.mouse.x, state.mouse.y]).join(',')}`);

        board.render(sketch);
        board.update(sketch);

        RenderObject.tick(sketch);
        RenderObject.draw(sketch);

        state.tooltipPane.update(sketch);
        state.tooltipPane.render(sketch);

        if (state.renderedComponents)
            state.renderedComponents.forEach(i => i.component.updated = false);

        state.cursor.render(sketch);
        state.cursor.update(sketch);
    }
});
