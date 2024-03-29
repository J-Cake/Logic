import type p5 from 'p5';
import $ from 'jquery';

import {manager, Tool} from '../../State';
import {DebugMode} from '../../Enums';

export function clickHandler(sketch: p5) {
    const {dragStart, mouse, keys, tool, debug, renderedComponents: comps} = manager.setState();

    if (Math.sqrt((dragStart.x - mouse.x) ** 2 + (dragStart.y - mouse.y) ** 2) < 10) {
        if (tool === Tool.Debug)
            manager.broadcast('debug_click');
        else if (!debug.isStopped()) {
            if (tool === Tool.Pointer)
                manager.dispatch("click", prev => ({
                    mouse: {
                        x: sketch.mouseX + prev.board.translate[0],
                        y: sketch.mouseY + prev.board.translate[1],
                        pressed: sketch.mouseIsPressed
                    }
                }));
            else if (!keys.shift && tool === Tool.Select)
                comps.forEach(i => i.isSelected = false);
            else if (tool === Tool.Wire)
                manager.broadcast('wire_click');
            else if (tool === Tool.Label)
                manager.broadcast('label_click');
            if (tool === Tool.Select)
                manager.dispatch("select", prev => ({
                    mouse: {
                        x: sketch.mouseX + prev.board.translate[0],
                        y: sketch.mouseY + prev.board.translate[1],
                        pressed: sketch.mouseIsPressed
                    }
                }));
        }

        manager.broadcast('tick');
    }
}

export async function updateTooltips(e: JQuery.MouseMoveEvent) { // Call MouseDown only after traveling a minimum distance
    const tooltips: boolean = manager.setState().pref.setState().enableTooltips;

    if (tooltips) {
        const mgr = manager.setState();
        let comps = mgr.renderedComponents.reverse().find(i => i?.isWithinBounds(manager.setState()));

        type T = [boolean, number, number];
        const terminal = mgr.renderedComponents.reduce((a: T | null, i, b) => i.getTouchingTerminal([mgr.mouse.x, mgr.mouse.y])?.concat(b) as T ?? a, null);
        if (terminal) {
            comps = mgr.renderedComponents[terminal[2]];
            const name = terminal?.[0] ? comps?.component.outputNames[terminal?.[1]] : comps?.component.inputNames[terminal?.[1]];

            if (name)
                $("span#terminal").text(name);
        }

        if (comps) {
            $("span#component-label").text(comps.component.label);
            $("span#breakpoint").text(comps.component.isBreakpoint !== null ? DebugMode[comps.component.isBreakpoint] : '');
            $("span#type").text(comps.component.name);
            $("span#pos-x").text(comps.props.pos[0]);
            $("span#pos-y").text(comps.props.pos[1]);

            $("#tooltips")
                .addClass("visible")
                .css("left", e.pageX + "px")
                .css("top", e.pageY + "px");
        } else {
            $("span#component-label").text("");
            $("span#terminal").text("");
            $("span#debug").text("");
            $("span#type").text("");
            $("span#pos-x").text("");
            $("span#pos-y").text("");
            $("#tooltips").removeClass("visible");
        }

        const {dragStart, mouse} = manager.setState();
        if (Math.sqrt((dragStart.x - mouse.x) ** 2 + (dragStart.y - mouse.y) ** 2) > 5)
            if (!manager.setState().dragObjects.find(i => i.isDragging))
                manager.dispatch("mouseDown", {
                    mouse
                });
    } else
        $("#tooltips").hide();
}