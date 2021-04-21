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

    bindKeys();
    bindButtons();

    // $('button#save').on('click', () => saveDocument());
    // $('button#close').on('click', () => window.location.href = '/dashboard#own');
    //
    // $("#show-labels").on('change', function () {
    //     return manager.setState().pref.setState({
    //         enableTooltips: $(this).prop("checked")
    //     });
    // });
    // $("#refresh-ui").on('click', () => manager.broadcast("refresh-ui"));
    //
    // $('#in').on('click', () => manager.setState(prev => ({gridScale: Math.min(Math.max(prev.gridScale * 1.15, 1.5), 150)})));
    // $('#out').on('click', () => manager.setState(prev => ({gridScale: Math.min(Math.max(prev.gridScale * 0.85, 1.5), 150)})));
    // $('#in').on('click', () => manager.setState(prev => ({scale: Math.min(Math.max(prev.scale * 1.15, 1.5), 150)})));
    // $('#out').on('click', () => manager.setState(prev => ({scale: Math.min(Math.max(prev.scale * 0.85, 1.5), 150)})));
    //
    // $('#reset').on('click', () => manager.setState(prev => ({scale: 1})));
    //
    // $("#remove-component").on('click', () => manager.setState().circuit.deleteSelected());
    //
    // $("#flip").on('click', function () {
    //     const prev = manager.setState();
    //     for (const i of prev.renderedComponents.filter(i => i.isSelected))
    //         i.props.flip = !i.props.flip;
    // });
    //
    // $("#rotate-left").on('click', function () {
    //     const prev = manager.setState();
    //     for (const i of prev.renderedComponents.filter(i => i.isSelected))
    //         i.props.direction = ({
    //             [0]: 3,
    //             [1]: 0,
    //             [2]: 1,
    //             [3]: 2,
    //         } as Record<0 | 1 | 2 | 3, 0 | 1 | 2 | 3>)[i.props.direction];
    // });
    // $("#rotate-right").on('click', function () {
    //     const prev = manager.setState();
    //     for (const i of prev.renderedComponents.filter(i => i.isSelected))
    //         i.props.direction = ({
    //             [0]: 1,
    //             [1]: 2,
    //             [2]: 3,
    //             [3]: 0,
    //         } as Record<0 | 1 | 2 | 3, 0 | 1 | 2 | 3>)[i.props.direction];
    // });

    window.addEventListener("resize", function () {
        sketch.resizeCanvas(container.width() ?? window.innerWidth, container.height() ?? window.innerHeight);
    });

    window.addEventListener('beforeunload', async function (e) {
        await new Promise(() => closeAll());
        e.returnValue = `There may be unsaved changes. Are you sure you wish to leave?`;
    });

    canvas.on("click", () => clickHandler(sketch));

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

    canvas.on("mousemove", e => updateTooltips(e));

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