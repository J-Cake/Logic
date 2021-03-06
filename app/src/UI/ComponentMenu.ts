import * as $ from 'jquery';

import {manager, Tool} from "../index";
import RenderComponent from "./RenderComponent";
import {Dialog, link} from "./DialogManager";

export default function buildPrompt() {
    link(Dialog.ComponentView, $("#add-component"), function() {

    });
    // $("#add-component").on("change", function () {
    //     setVisible(Dialog.ComponentView, $(this).is(":checked"), (isClosed) => $(this).prop('checked', !isClosed));
    // });
    //
    // manager.setState().dialogManager.on('open', prev => {
    //     (prev[Dialog.ComponentView] as (Window & {
    //         init: (s: State) => void,
    //         stateManager: StateManager<State>,
    //         src: Promise<void>
    //     })).addEventListener('connect', function (e: CustomEvent<(state: Partial<State>) => void>) {
    //         if (typeof e.detail === 'function')
    //             e.detail({
    //                 onSelect: id => addComponent(id),
    //             });
    //         else
    //             console.error('no init function');
    //     } as EventListener);
    // });
}

export function addComponent(componentId: string) {
    const {circuit: mgr, board, mouse} = manager.setState(),
        {availableComponents} = mgr.state.setState(),
        Component = availableComponents[componentId];
    if (Component) {
        window.focus();
        // const name = window("Component Label");
        $("#move").prop("checked", true);
        const component = new Component(mgr.getNextAvailComponentId(), {
            direction: 1,
            outputs: {},
            position: board.coordsToGrid([mouse.x, mouse.y]),
            label: '',
            flip: false,
            wires: {}
        });
        // console.log(componentId, component);
        mgr.addComponent(component);

        manager.setState(function (prev) {
            const r = new RenderComponent(component, {
                direction: 0,
                isStateful: false,
                label: name || '',
                pos: prev.board.coordsToGrid([prev.mouse.x, prev.mouse.y]),
                flip: false,
                isMoving: true
            });

            r.mousePos = r.pos = [prev.mouse.x, prev.mouse.y];

            return ({
                tool: Tool.Move,
                renderedComponents: [...prev.renderedComponents, r]
            });
        });
    } else
        alert("The component wasn't found or is unusable");
}