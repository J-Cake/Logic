import * as p5 from 'p5';
import {manager, Tool} from "../../State";
import * as $ from "jquery";
import {DebugMode} from "../../Enums";

export function clickHandler(sketch: p5) {
    const {dragStart, mouse, keys, tool, debug, renderedComponents: comps} = manager.setState();

    if (Math.sqrt((dragStart.x - mouse.x) ** 2 + (dragStart.y - mouse.y) ** 2) < 10) {
        if (tool === Tool.Debug) {
            manager.broadcast('debug_click');
            new Promise(k => k(manager.broadcast('tick')));
        } else if (!debug.isStopped()) {
            if (tool === Tool.Pointer)
                manager.dispatch("click", prev => ({
                    mouse: {
                        x: sketch.mouseX + prev.board.translate[0],
                        y: sketch.mouseY + prev.board.translate[1],
                        pressed: true
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
                        pressed: true
                    }
                }));
        }
    }
}

export async function updateTooltips(e: JQuery.MouseMoveEvent) { // Call MouseDown only after traveling a minimum distance
    const tooltips: boolean = manager.setState().pref.setState().enableTooltips;

    if (tooltips) {
        const comps = manager.setState().renderedComponents.reverse().find(i => i.isWithinBounds(manager.setState()));

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