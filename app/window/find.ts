import * as $ from 'jquery';
import * as mousetrap from 'mousetrap';

mousetrap.bind('esc', () => window.close());

if (!window.opener)
    alert("This page is not connected to the application and will not function as intended.");

new Promise<BroadcastChannel>((ok) => ok(window.opener.connect())).then(function(bc: BroadcastChannel) {
    console.log(bc);
    $(".info").on('click', function() {
        fetch(`/circuit/${window.location.href.split('/').pop()}/add-component?component=${$(this).data('token')}`, {method: 'put'}).then(res => {
            if (res.ok)
                window.close();
        });
    });
});