import $ from 'jquery';
import mousetrap from 'mousetrap';
import {addComponent} from "../src/sys/API/circuit";

mousetrap.bind('esc', () => window.close());

if (!window.opener)
    alert("This page is not connected to the application and will not function as intended.");

const connect: typeof window.connect = () => window.opener.connect();

new Promise<(msgFn: string) => void>(ok => ok(connect())).then(function(msgFn) {

    $(".info").on('click', function() {
        const tok = $(this).data('token');
        addComponent(window.location.pathname.split('/').pop() as string, tok).then(res => {
            msgFn(tok);
            window.close();
        });
    });
});