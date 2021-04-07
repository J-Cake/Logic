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
import {DebugMode} from "../Logic/Debugger";

export default function handleEvents(canvas: JQuery, sketch: p5, comps: RenderComponent[]) {
    const container = $('#canvas-container');

    $(document).on('keyup keydown mousedown mouseup mousemove mouseenter mouseleave mousewheel', () => sketch.loop());

    $(document).on('keyup keydown', e => manager.setState({
        keys: {
            shift: e.shiftKey ?? false,
            ctrl: e.ctrlKey ?? false,
            alt: e.altKey ?? false,
            meta: e.metaKey ?? false
        }
    }));

    $('button#save').on('click', () => saveDocument());
    $('button#close').on('click', () => window.location.href = '/dashboard#own');

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
            enableTooltips: $(this).prop("checked")
        });
    });
    $("#refresh-ui").on('click', () => manager.broadcast("refresh-ui"));

    // $('#in').on('click', () => manager.setState(prev => ({gridScale: Math.min(Math.max(prev.gridScale * 1.15, 1.5), 150)})));
    // $('#out').on('click', () => manager.setState(prev => ({gridScale: Math.min(Math.max(prev.gridScale * 0.85, 1.5), 150)})));
    $('#in').on('click', () => manager.setState(prev => ({scale: Math.min(Math.max(prev.scale * 1.15, 1.5), 150)})));
    $('#out').on('click', () => manager.setState(prev => ({scale: Math.min(Math.max(prev.scale * 0.85, 1.5), 150)})));

    $('#reset').on('click', () => manager.setState(prev => ({scale: 1})));

    $("#remove-component").on('click', () => manager.setState().circuit.deleteSelected());

    $("#flip").on('click', function () {
        const prev = manager.setState();
        for (const i of prev.renderedComponents.filter(i => i.isSelected))
            i.props.flip = !i.props.flip;
    });

    $("#rotate-left").on('click', function () {
        const prev = manager.setState();
        for (const i of prev.renderedComponents.filter(i => i.isSelected))
            i.props.direction = ({
                [0]: 3,
                [1]: 0,
                [2]: 1,
                [3]: 2,
            } as Record<0 | 1 | 2 | 3, 0 | 1 | 2 | 3>)[i.props.direction];
    });
    $("#rotate-right").on('click', function () {
        const prev = manager.setState();
        for (const i of prev.renderedComponents.filter(i => i.isSelected))
            i.props.direction = ({
                [0]: 1,
                [1]: 2,
                [2]: 3,
                [3]: 0,
            } as Record<0 | 1 | 2 | 3, 0 | 1 | 2 | 3>)[i.props.direction];
    });

    window.addEventListener("resize", function () {
        sketch.resizeCanvas(container.width() ?? window.innerWidth, container.height() ?? window.innerHeight);
    });

    window.addEventListener('beforeunload', async function (e) {
        await new Promise(() => closeAll());
        e.returnValue = `There may be unsaved changes. Are you sure you wish to leave?`;
    });

    canvas.on("click", function () {
        const {dragStart, mouse, keys, tool, debug} = manager.setState();

        if (Math.sqrt((dragStart.x - mouse.x) ** 2 + (dragStart.y - mouse.y) ** 2) < 10) {
            if (tool === Tool.Debug) {
                manager.broadcast('debug_click');
                new Promise(k => k(manager.broadcast('tick')));
            }
            else if (!debug.isStopped()) {
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

    canvas.on("mousemove", async function (e) { // Call MouseDown only after traveling a minimum distance

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

    // manager.on('refresh-ui', () => system = getSystemColours());

    mousetrap.bind("enter", () => manager.broadcast("enter"));

    // mousetrap.bind(['delete', 'backspace'], () => manager.broadcast('delete'));
    mousetrap.bind(['del', 'backspace'], () => manager.setState().circuit.deleteSelected());

    mousetrap.bind('space', () => manager.setState().renderedComponents.forEach(i => i.isSelected ? i.onClick() : null));

    mousetrap.bind("ctrl+a", () => manager.setState().renderedComponents.forEach(i => i.isSelected = true));
    mousetrap.bind("ctrl+alt+a", () => manager.setState().renderedComponents.forEach(i => i.isSelected = false));

    mousetrap.bind(["1", "p"], () => $("#pointer").prop('checked', true));
    mousetrap.bind(["2", "b"], () => $("#select").prop('checked', true));
    mousetrap.bind(["3", "g"], () => $("#move").prop('checked', true));
    mousetrap.bind(["4", "w"], () => $("#wire").prop('checked', true));
    mousetrap.bind(["5", "d"], () => $("#debug").prop('checked', true));
    mousetrap.bind(["6", "l"], () => $("#label").prop('checked', true));

    mousetrap.bind('ctrl+s', async function (e) {
        e.preventDefault();
        await saveDocument();
    });

    mousetrap.bind('esc', async function (e) {
        e.preventDefault();
        return window.location.href = "/dashboard#own";
    });

    touch();
    buildWire();
}