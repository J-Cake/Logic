import $ from 'jquery';

import {manager, Tool} from '../';
import RenderComponent from '../ui/RenderComponent';
import {Dialog, link} from './DialogManager';
import getColourForComponent from '../ui/output/getColourForComponent';
import {ActionType, performAction} from "../sys/Action";

export default function buildPrompt() {
    link(Dialog.ComponentView, $("#add-component"), function (componentToken: string) {
        window.focus();
        if (componentToken in manager.setState().circuit.state.setState().availableComponents) {
            window.focus();
            $("#move").prop("checked", true);

            manager.setState().cursor.showGhostComponent(componentToken);

        } else
            alert("The component wasn't found or is unusable");
    });
}