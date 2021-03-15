import * as $ from 'jquery';
import * as Mousetrap from "mousetrap";

export const mousetrap = new Mousetrap();

mousetrap.bind('esc', () => window.close());

$(window).on('load', function() {
    // Thanks SO
    if (window.opener)
        window.opener.connect();
});