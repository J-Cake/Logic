import $ from "jquery";
import type p5 from 'p5';

import {manager, Tool} from "./State";
import {renderComponents} from "./ui/RenderComponent";
import Board from "./sys/components/Board";
import TooltipPane from "./ui/output/TooltipPane";
import Cursor from "./ui/output/cursor";
import CircuitManager from "./Logic/io/CircuitManager";
import handleEvents from "./ui/input/events";
import mousetrap from "mousetrap";
import buildComponentPrompt from "./menus/ComponentMenu";
import buildFinderPrompt from "./menus/ComponentFinder";
import getColourForComponent from "./ui/output/getColourForComponent";
import {Dialog, invokeCallback} from "./menus/DialogManager";
import HistoryManager from "./sys/historyManager";

export default async function init(sketch: p5, p5Canvas: p5.Renderer, documentId: string) {
    const {canvas} = manager.setState({
        p5Canvas: p5Canvas,
        canvas: $(p5Canvas.elt)
    });

    $("button").prop('disabled', true);
    manager.on('loaded', function (state) {
        if (state.ready)
            $("button").prop('disabled', false);
    })

    manager.dispatch('init', ({
        renderedComponents: await renderComponents(manager.setState(() => ({
            font: sketch.loadFont("/app/font/font-2.ttf"),
            iconFont: sketch.loadFont("/app/font/remixicon.ttf"),
            board: new Board(),
            tooltipPane: new TooltipPane(),
            sidebarWidth: 6,
            switchFrame: 0,
            tool: Tool.Pointer,
            cursor: new Cursor(),
            documentIdentifier: documentId,
            circuit: new CircuitManager(documentId),
            history: new HistoryManager(),
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

    manager.on('tick', async (state) => {
        sketch.loop();
        setTimeout(() => sketch.noLoop(), 250);

        const {raw, availableComponents: avail} = state.circuit.state.setState();
        await Promise.resolve().then(function () {
            $("div#component-colours").html(Object.keys(avail)
                .map(i => `<span class="component-colour" style="background: rgb(${getColourForComponent(i)});">${raw[i]?.name ?? i}</span>`).join(''));
            $("div#component-colours span.component-colour").each((i, e) =>
                void $(e).on('click', () => invokeCallback(Dialog.ComponentView, Object.keys(avail)[i])))
        });
    });

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
}