import * as $ from "jquery";
import type * as p5 from 'p5';
import * as mousetrap from "mousetrap";

import RenderObject from "../sys/components/RenderObject";
import {manager, Tool} from "../index";
import RenderComponent from "./RenderComponent";
import {GenComponent} from "../ComponentFetcher";
import {closeAll} from "./DialogManager";

export default function handleEvents(canvas: JQuery, sketch: p5, comps: RenderComponent<GenComponent>[]) {
    const container = $('#canvas-container');

    $(document).on('keyup keydown', e => manager.setState({
        keys: {
            shift: e.shiftKey ?? false,
            ctrl: e.ctrlKey ?? false,
            alt: e.altKey ?? false,
            meta: e.metaKey ?? false
        }
    }));

    const toolBtnId: { [key in 'debug' | 'move' | 'pointer' | 'select' | 'wire']: Tool } = {
        'debug': Tool.Debug,
        'move': Tool.Move,
        'pointer': Tool.Pointer,
        'select': Tool.Select,
        'wire': Tool.Wire
    };

    $('[name="tool"]').on('change', function () {
        manager.setState({
            tool: toolBtnId[(Object.keys(toolBtnId).find(i => i === this.id) as keyof typeof toolBtnId | undefined) || 'pointer']
        });
    });

    window.addEventListener("resize", function () {
        sketch.resizeCanvas(container.width() ?? window.innerWidth, container.height() ?? window.innerHeight);
    });

    window.addEventListener('beforeunload', function (e) {
        new Promise(() => closeAll());
        e.returnValue = `There may be unsaved changes. Are you sure you wish to leave?`;
    });

    canvas.on("click", function () {
        const {dragStart, mouse, keys, tool} = manager.setState();

        if (Math.sqrt((dragStart.x - mouse.x) ** 2 + (dragStart.y - mouse.y) ** 2) < 10) {
            if (tool === Tool.Pointer)
                manager.dispatch("click", () => ({mouse: {x: sketch.mouseX, y: sketch.mouseY}}));
            else if (!keys.shift && tool === Tool.Select)
                comps.forEach(i => i.isSelected = false);

            if (tool === Tool.Select)
                manager.dispatch("select", () => ({mouse: {x: sketch.mouseX, y: sketch.mouseY}}));
        }
    })

    canvas.on("mousedown", function () {
        const {tool} = manager.setState();
        if (tool === Tool.Move)
            manager.dispatch('mouse-grab', () => ({mouse: {x: sketch.mouseX, y: sketch.mouseY}}))
        manager.setState({
            dragStart: {x: sketch.mouseX, y: sketch.mouseY}
        });
    });

    canvas.on("mousemove", function () { // Call MouseDown only after traveling a minimum distance
        const {dragStart, mouse} = manager.setState();
        if (Math.sqrt((dragStart.x - mouse.x) ** 2 + (dragStart.y - mouse.y) ** 2) > 5)
            if (!manager.setState().dragObjects.find(i => i.isDragging))
                manager.dispatch("mouseDown", {
                    mouse
                });
    });

    canvas.on("mouseup", function () {
        const {tool} = manager.setState();
        if (tool === Tool.Move)
            manager.dispatch("mouse-drop", () => ({mouse: {x: sketch.mouseX, y: sketch.mouseY}}));
        manager.dispatch("mouseUp", {
            mouseDown: true
        });
    });

    manager.on("restart", function () {
        manager.setState().board.reset();
        RenderObject.print();
    });

    mousetrap.bind("enter", () => manager.broadcast("enter"));

    mousetrap.bind("ctrl+a", () => manager.setState().renderedComponents.forEach(i => i.isSelected = true));

    mousetrap.bind("ctrl+1", () => $("#pointer").prop('checked', true));
    mousetrap.bind("ctrl+2", () => $("#select").prop('checked', true));
    mousetrap.bind("ctrl+3", () => $("#move").prop('checked', true));
    mousetrap.bind("ctrl+4", () => $("#wire").prop('checked', true));
    mousetrap.bind("ctrl+5", () => $("#debug").prop('checked', true));
}