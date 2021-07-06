import $ from 'jquery';

import {manager} from '../';
import {Dialog, link} from './DialogManager';

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