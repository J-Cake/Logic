import * as $ from 'jquery';
import * as mousetrap from 'mousetrap';

mousetrap.bind('esc', () => window.close());

if (!window.opener)
    alert("This page is not connected to the application and will not function as intended.");

const connect: typeof window.connect = () => window.opener.connect();

new Promise<(msgFn: string) => void>(ok => ok(connect())).then(function(msgFn) {

    $(".info").on('click', function() {
        const tok = $(this).data('token');
        fetch(`/circuit/${window.location.pathname.split('/').pop()}/add-component?component=${tok}`, {method: 'put'}).then(res => {
            if (res.ok) {
                msgFn(tok);
                window.close();
            }
        });
    });
});