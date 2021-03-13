import * as $ from "jquery";
import {connect} from "./prompt";

// $(document).on('click', () => connect());

connect(function () {
    console.log('hello');
});