import * as $ from 'jquery';
import * as _p5 from 'p5';
import * as mousetrap from 'mousetrap';

import {manager, Tool} from './State';
import RenderObject from './sys/components/RenderObject';
import Board from './sys/components/Board';
import {Interpolation} from './sys/util/interpolation';
import {getColour, hex} from "./sys/util/Colour";
import Cursor from "./ui/output/cursor";
import CircuitManager from "./Logic/io/CircuitManager";
import {renderComponents} from "./ui/RenderComponent";
import handleEvents from "./ui/input/events";
import TooltipPane from "./ui/output/TooltipPane";
import Colour from "./sys/util/Themes";
import buildComponentPrompt from "./menus/ComponentMenu";
import buildFinderPrompt from "./menus/ComponentFinder";

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
    sketch.setup = async function () {
        const documentId: string = $("#circuitToken").text();

        const container = $('#canvas-container');

        const p5Canvas = sketch.createCanvas(container.width() ?? window.innerWidth, container.height() ?? window.innerHeight);
        p5Canvas.parent(container[0]);

        const {canvas} = manager.setState({
            p5Canvas: p5Canvas,
            canvas: $(p5Canvas.elt)
        });

        manager.setState(({
            renderedComponents: await renderComponents(manager.setState(() => ({
                font: sketch.loadFont("/app/font-2.ttf"),
                iconFont: sketch.loadFont("/app/remixicon.ttf"),
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
        }));

        handleEvents(canvas, sketch);

        sketch.textFont(manager.setState().font);

        manager.on('tick', async () => sketch.loop());

        $("#canvas-container").on('wheel', function (e) {
            const event: WheelEvent = e.originalEvent as WheelEvent;

            if (manager.setState().keys.shift)
                manager.setState(prev => ({pan: [prev.pan[0] - event.deltaY, prev.pan[1] - event.deltaX]}));
            else
                manager.setState(prev => ({pan: [prev.pan[0] - event.deltaX, prev.pan[1] - event.deltaY]}));

            e.preventDefault();
        });

        mousetrap.bind('alt+s', () => manager.setState(({pan: [0, 0], scale: 1})));

        buildComponentPrompt();
        buildFinderPrompt();

        const {pan, scale} = manager.setState();

        sketch.translate(pan[0], pan[1]);
        sketch.scale(scale);

        sketch.background(getColour(Colour.Background, {duration: 30, type: Interpolation.linear}));

        manager.broadcast('tick');
    }

    sketch.draw = async function () {
        $("#debug-container input").prop("disabled", true);

        const {pan, scale} = manager.setState();

        sketch.translate(pan[0], pan[1]);
        sketch.scale(scale);

        sketch.background(getColour(Colour.Background, {duration: 30, type: Interpolation.linear}));
        // if (manager.setState().debug.isStopped())
        //     sketch.background(transparent(Colour.SecondaryAccent, 25));

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

        if (state.wirePreview)
            state.wirePreview(sketch);

        sketch.noLoop();
    }
});
