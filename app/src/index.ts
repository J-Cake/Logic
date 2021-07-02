import $ from 'jquery';
import p5 from 'p5';
import mousetrap from 'mousetrap';

import {manager, Tool} from './State';
import RenderObject from './sys/components/RenderObject';
import Board from './sys/components/Board';
import {Interpolation} from './sys/util/interpolation';
import {getColour} from './sys/util/Colour';
import Cursor from './ui/output/cursor';
import CircuitManager from './Logic/io/CircuitManager';
import {renderComponents} from './ui/RenderComponent';
import handleEvents from './ui/input/events';
import TooltipPane from './ui/output/TooltipPane';
import Colour from './sys/util/Themes';
import buildComponentPrompt from './menus/ComponentMenu';
import buildFinderPrompt from './menus/ComponentFinder';
import renderAnimation from "./ui/output/Animation";
import {loadingAnimation} from "./ui/output/animations/loadingAnimation";
import getColourForComponent from "./ui/output/getColourForComponent";
import init from "./init";

declare global {
    interface Array<T> {
        last(i?: number): T;
    }
}
Array.prototype.last = function (i: number = 0) {
    return this[this.length - (Math.max(i, 0) + 1)];
}

export * from './State';

new p5(function (sketch: p5) {
    sketch.setup = async function () {
        const documentId: string = $("#circuitToken").text();

        const container = $('#canvas-container');

        const p5Canvas = sketch.createCanvas(container.width() ?? window.innerWidth, container.height() ?? window.innerHeight);
        p5Canvas.parent(container[0]);

        const {pan} = manager.setState();

        sketch.translate(Math.floor(pan[0]) + 0.5, Math.floor(pan[1]) + 0.5);
        sketch.scale(1);

        sketch.background(getColour(Colour.Background, {duration: 30, type: Interpolation.linear}));

        manager.broadcast('tick');

        init(sketch, p5Canvas, documentId).then(() => manager.broadcast('ready'));
    }

    sketch.draw = async function () {
        $("#debug-container input").prop("disabled", true);

        const {pan, ready} = manager.setState();

        sketch.background(getColour(Colour.Background, {duration: 30, type: Interpolation.linear}));

        if (ready) {
            sketch.translate(Math.floor(pan[0]) + 0.5, Math.floor(pan[1]) + 0.5);
            sketch.scale(1);

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
            board.translate = [-Math.floor(pan[0]), -Math.floor(pan[1])];

            $("span#grid-pos").text(`${board.coordsToGrid([state.mouse.x, state.mouse.y]).join(',')}`);

            board.render(sketch);
            board.update(sketch);

            for(const i of state.renderedComponents)
                if (i) {
                    i.update(sketch);
                    i.render(sketch);
                }

            if (state.renderedComponents)
                state.renderedComponents.forEach(i => i.component.updated = false);

            state.cursor.render(sketch);
            state.cursor.update(sketch);

            if (state.wirePreview)
                state.wirePreview(sketch);
        } else
            renderAnimation(loadingAnimation, sketch);
    }
});
