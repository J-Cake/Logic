import $ from 'jquery';
import type p5 from 'p5';

import RenderObject from '../../sys/components/RenderObject';
import {manager, Tool} from '../../';
import {closeAll} from '../../menus/DialogManager';
import touch from './touch';
import {clickHandler, updateTooltips} from './mouseEvents';
import bindKeys from './keymap';
import bindButtons from './buttons';
import {initWires} from '../output/wire/InitWires';

export default function handleEvents(canvas: JQuery, sketch: p5) {
    const container = $('#canvas-container');

    manager.on('ready', () => {
        bindKeys();
        bindButtons();
    });

    $(document).on('keyup keydown mousedown mouseup mousemove mouseenter mouseleave mousewheel', () => sketch.loop());

    $(document).on('keyup keydown', e => manager.setState({
        keys: {
            shift: e.shiftKey ?? false,
            ctrl: e.ctrlKey ?? false,
            alt: e.altKey ?? false,
            meta: e.metaKey ?? false
        }
    }));

    const toolBtnId: { [key in 'debug' | 'move' | 'pointer' | 'select' | 'wire' | 'label']: Tool } = {
        'debug': Tool.Debug,
        'move': Tool.Move,
        'pointer': Tool.Pointer,
        'select': Tool.Select,
        'wire': Tool.Wire,
        'label': Tool.Label
    };

    $('[name="tool"]').on('change', function () {
        manager.dispatch('tick', {
            tool: toolBtnId[(Object.keys(toolBtnId).find(i => i === this.id) as keyof typeof toolBtnId | undefined) ?? 'pointer']
        });
    });

    window.addEventListener("resize", function () {
        sketch.resizeCanvas(container.width() ?? window.innerWidth, container.height() ?? window.innerHeight);
    });

    window.addEventListener('beforeunload', async function (e) {
        await new Promise(() => closeAll());
        e.returnValue = `There may be unsaved changes. Are you sure you wish to leave?`;
        manager.broadcast('action');
    });

    canvas.on("click", () => clickHandler(sketch));

    canvas.on("mousedown", function () {
        const {tool} = manager.setState(prev => ({
            dragStart: {x: sketch.mouseX + prev.board.translate[0], y: sketch.mouseY + prev.board.translate[1]}
        }));

        if (tool === Tool.Move)
            manager.dispatch('mouse-grab', (prev) => ({
                mouse: {
                    x: sketch.mouseX + prev.board.translate[0],
                    y: sketch.mouseY + prev.board.translate[1],
                    pressed: true
                }
            }));
    });

    canvas.on("mousemove", function (e) {
        updateTooltips(e);

        const state = manager.setState();
        if
        (state.tool === Tool.Move && state.mouseDown)
            manager.broadcast('move');
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

    touch();
    initWires();
}