import * as $ from 'jquery';
import {Dialog, setVisible} from "./DialogManager";

export default function buildPrompt() {
    $("#import-component").on("change", function () {
        setVisible(Dialog.ComponentFinder, $(this).is(":checked"), (isClosed) => $(this).prop('checked', !isClosed));
    });
}
