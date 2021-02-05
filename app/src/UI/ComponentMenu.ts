import * as $ from 'jquery';

import RenderComponent from "./RenderComponent";
import {manager, Tool} from "../index";
import {Dialog, setVisible} from "./DialogManager";
import {State} from "../../componentMenu";
import {themes} from "../sys/util/Themes";
import StateManager from "../sys/util/stateManager";

export default function buildPrompt() {
    $("#add-component").on("change", function () {
        setVisible(Dialog.ComponentView, $(this).is(":checked"), (isClosed) => $(this).prop('checked', !isClosed));
    });

    manager.setState().dialogManager.on('open', prev => {
        (prev[Dialog.ComponentView] as (Window & {
            init: (s: State) => void,
            stateManager: StateManager<State>,
            src: Promise<void>
        })).addEventListener('connect', function (e: CustomEvent<(state: Partial<State>) => void>) {
            if (typeof e.detail === 'function')
                e.detail({
                    onSelect: id => addComponent(id),
                    theme: themes[manager.setState().themes.last()]()
                });
            else
                console.error('no init function');
        } as EventListener);
    });
}

export function addComponent(componentId: string) {
    const {circuit: mgr, board, mouse} = manager.setState(), {availableComponents} = mgr.state.setState(),
        Component = availableComponents[componentId];
    if (Component) {
        const name = prompt("Component Label");
        if (name) {
            $("#move").prop("checked", true);
            const component = new Component(mgr.getNextAvailComponentId(), {
                direction: 1,
                identifier: name,
                outputs: [],
                position: board.getMouseGridCoords([mouse.x, mouse.y]),
                wires: {}
            });
            // console.log(componentId, component);
            mgr.addComponent(component);

            manager.setState(prev => ({
                tool: Tool.Move,
                renderedComponents: [...prev.renderedComponents, new RenderComponent(component, {
                    direction: 0,
                    isStateful: false,
                    label: name || '',
                    pos: prev.board.getMouseGridCoords([prev.mouse.x, prev.mouse.y]),
                    isMoving: true
                })]
            }));
        }
    } else
        alert("The component wasn't found or is unusable");
}