import * as $ from "jquery";
import type * as p5 from 'p5';
import * as mousetrap from "mousetrap";

import RenderObject from "../sys/components/RenderObject";
import {manager, Tool} from "../index";
import RenderComponent from "./RenderComponent";
import {closeAll} from "./DialogManager";
import saveDocument from "../Logic/DocumentWriter";
import {buildWire} from "./Wire";
import touch from "./touch";

export default function handleEvents(canvas: JQuery, sketch: p5, comps: RenderComponent[]) {
    const container = $('#canvas-container');

    $(document).on('keyup keydown', e => manager.setState({
        keys: {
            shift: e.shiftKey ?? false,
            ctrl: e.ctrlKey ?? false,
            alt: e.altKey ?? false,
            meta: e.metaKey ?? false
        }
    }));

    $('button#save').on('click', () => saveDocument());
    $('button#close').on('click', () => window.location.href = '/dashboard');

    const toolBtnId: { [key in 'debug' | 'move' | 'pointer' | 'select' | 'wire' | 'label']: Tool } = {
        'debug': Tool.Debug,
        'move': Tool.Move,
        'pointer': Tool.Pointer,
        'select': Tool.Select,
        'wire': Tool.Wire,
        'label': Tool.Label
    };

    $('[name="tool"]').on('change', function () {
        manager.setState({
            tool: toolBtnId[(Object.keys(toolBtnId).find(i => i === this.id) as keyof typeof toolBtnId | undefined) || 'pointer']
        });
    });

    $("#show-labels").on('change', function () {
        return manager.setState().pref.setState({
            showLabels: $(this).prop("checked")
        });
    });

    $('#in').on('click', () => manager.setState(prev => ({gridScale: prev.gridScale * 1.15})));
    $('#out').on('click', () => manager.setState(prev => ({gridScale: prev.gridScale * 0.85})));
    $('#reset').on('click', () => manager.setState(prev => ({gridScale: 35})));

    $("#remove-component").on('click', () => manager.setState().circuit.deleteSelected());

    window.addEventListener("resize", function () {
        sketch.resizeCanvas(container.width() ?? window.innerWidth, container.height() ?? window.innerHeight);
    });

    window.addEventListener('beforeunload', async function (e) {
        await new Promise(() => closeAll());
        e.returnValue = `There may be unsaved changes. Are you sure you wish to leave?`;
    });

    canvas.on("click", function () {
        const {dragStart, mouse, keys, tool, debug} = manager.setState();

        if (!debug.isStopped()) {
            if (Math.sqrt((dragStart.x - mouse.x) ** 2 + (dragStart.y - mouse.y) ** 2) < 10) {
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
                else if (tool === Tool.Debug)
                    manager.broadcast('debug_click');

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
    })

    canvas.on("mousedown", function () {
        const {tool} = manager.setState();
        if (tool === Tool.Move)
            manager.dispatch('mouse-grab', (prev) => ({
                mouse: {
                    x: sketch.mouseX + prev.board.translate[0],
                    y: sketch.mouseY + prev.board.translate[1],
                    pressed: true
                }
            }));
        manager.setState(prev => ({
            dragStart: {x: sketch.mouseX + prev.board.translate[0], y: sketch.mouseY + prev.board.translate[1]}
        }));
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
            manager.dispatch("mouse-drop", prev => ({
                mouse: {
                    x: sketch.mouseX + prev.board.translate[0],
                    y: sketch.mouseY + prev.board.translate[1],
                    pressed: false
                }
            }));
        manager.dispatch("mouseUp", {
            mouseDown: true
        });
    });

    manager.on("restart", function () {
        manager.setState().board.reset();
        RenderObject.print();
    });

    mousetrap.bind("enter", () => manager.broadcast("enter"));

    // mousetrap.bind(['delete', 'backspace'], () => manager.broadcast('delete'));
    mousetrap.bind(['del', 'backspace'], () => manager.setState().circuit.deleteSelected());

    mousetrap.bind('space', () => manager.setState().renderedComponents.forEach(i => i.isSelected ? i.onClick() : null));

    mousetrap.bind("ctrl+a", () => manager.setState().renderedComponents.forEach(i => i.isSelected = true));
    mousetrap.bind("ctrl+alt+a", () => manager.setState().renderedComponents.forEach(i => i.isSelected = false));

    mousetrap.bind("1", () => $("#pointer").prop('checked', true));
    mousetrap.bind("2", () => $("#select").prop('checked', true));
    mousetrap.bind("3", () => $("#move").prop('checked', true));
    mousetrap.bind("4", () => $("#wire").prop('checked', true));
    mousetrap.bind("5", () => $("#debug").prop('checked', true));

    mousetrap.bind('ctrl+s', async function (e) {
        e.preventDefault();
        await saveDocument();
    });

    touch();
    buildWire();
}