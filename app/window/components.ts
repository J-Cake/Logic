import * as $ from 'jquery';
import * as mousetrap from 'mousetrap';

mousetrap.bind('esc', () => window.close());

const connect: typeof window.connect = () => window.opener.connect();

new Promise<(msgFn: string) => void>(ok => ok(connect())).then(function (msgFn) {
    $(".component").on('click', function () {
        return msgFn($(this).find('.token').text());
    });
});

// new Promise((ok) => ok((window.opener.connect as typeof window.connect)())).then(function (msgFn: (msg: string) => void) {
//     $(".component").on('click', function () {
//         return msgFn($(this).find('.token').text());
//     });
// });