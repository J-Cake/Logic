import * as $ from 'jquery';
import * as mousetrap from 'mousetrap';

mousetrap.bind('esc', () => window.close());

if (!window.opener)
    alert("This page is not connected to the application and will not function as intended.");

new Promise<BroadcastChannel>((ok) => ok(window.opener.connect())).then(function(bc: BroadcastChannel) {
    console.log(bc);
    $("");
});