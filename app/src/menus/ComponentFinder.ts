import * as $ from 'jquery';
import {Dialog, link} from "./DialogManager";

export default function buildPrompt() {
    link(Dialog.ComponentFinder, $("#import-component"), function() {

    });
}
