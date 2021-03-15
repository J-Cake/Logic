import * as $ from 'jquery';
import {Dialog, link, setVisible} from "./DialogManager";

export default function buildPrompt() {
    link(Dialog.ComponentFinder, $("#import-component"), function() {

    });
}
