import * as $ from 'jquery';

import RenderComponent from "./RenderComponent";
import Component from "../Logic/Component";
import {manager, Tool} from "../index";
import {Dialog, setVisible} from "./DialogManager";
import {State} from "../../componentMenu";
import {themes} from "../sys/util/Themes";

export default function buildPrompt() {
    $("#add-component").on("change", function () {
        setVisible(Dialog.ComponentView, $(this).is(":checked"), (isClosed) => $(this).prop('checked', !isClosed));
    });

    manager.setState().dialogManager.on('open', prev => {
        const win = prev[Dialog.ComponentView];
        if (win)
            win.window.addEventListener('load', function () {
                if ("init" in (win.window as Window & {init: (s: State) => void}))
                    win.init({
                        onSelect: id => addComponent(id),
                        theme: themes[manager.setState().themes.last()]()
                    });
                else
                    console.error('no init function');
            });
        else
            console.error('no window');
    });
}

export function addComponent(componentId: string) {
    const mgr = manager.setState().circuit;
    const availableComponents = mgr.state.setState().availableComponents;
    const Component = availableComponents[componentId];

    console.log(componentId, Component);

    if (Component) {
        const name = prompt("Component Label");
        if (name) {
            $("#move").prop("checked", true);
            const component = new Component(mgr.getNextAvailComponentId());
            console.log(componentId, component);
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