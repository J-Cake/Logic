import * as $ from 'jquery';
import {Dialog, link} from "./DialogManager";
import {manager} from "../State";
import fetchComponent from "../Logic/io/ComponentFetcher";

export default function buildPrompt() {
    link(Dialog.ComponentFinder, $("#import-component"), async function (componentToken) {
        await manager.setState().circuit.state.setStateAsync(async prev => ({
            availableComponents: {
                ...prev.availableComponents,
                [componentToken]: await fetchComponent(componentToken)
            }
        }));
    });
}