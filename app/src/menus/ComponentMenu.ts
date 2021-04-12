import * as $ from 'jquery';

import {manager, Tool} from "../index";
import RenderComponent from "../ui/RenderComponent";
import {Dialog, link} from "./DialogManager";
import getColourForComponent from '../ui/output/getColourForComponent';

export default function buildPrompt() {
    link(Dialog.ComponentView, $("#add-component"), function (componentToken: string) {
        const {circuit: mgr, board, mouse} = manager.setState(),
            {availableComponents} = mgr.state.setState(),
            Component = availableComponents[componentToken];
        if (Component) {
            window.focus();
            $("#move").prop("checked", true);
            const component = new Component(mgr.getNextAvailComponentId(), {
                direction: 1,
                outputs: {},
                position: board.coordsToGrid([mouse.x, mouse.y]),
                label: '',
                flip: false,
                wires: {}
            });

            mgr.addComponent(component);

            manager.setState(function (prev) {
                const r = new RenderComponent(component, {
                    direction: 0,
                    isStateful: false,
                    label: name || '',
                    pos: prev.board.coordsToGrid([prev.mouse.x, prev.mouse.y]),
                    flip: false,
                    isMoving: true,
                    colour: getColourForComponent(componentToken)
                });

                r.mousePos = r.pos = [prev.mouse.x, prev.mouse.y];

                return ({
                    tool: Tool.Move,
                    renderedComponents: [...prev.renderedComponents, r]
                });
            });
        } else
            alert("The component wasn't found or is unusable");
    });
}