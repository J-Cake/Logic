import type express from 'express';

/**
 * This is basically the [the Express.js vhost](https://github.com/expressjs/vhost/) library but stripped down to a clean and usable format
 * @param hostnames matches only if hostname begins with match or only if it does not begin with any entries in array if array
 * @param app The response, should it match
 */
export default function host(hostnames: string | string[], app: express.Application): express.RequestHandler {
    const matches = function (host: string): boolean {
        console.log(host, hostnames);
        if (typeof hostnames === "string")
            return host.startsWith(hostnames);
        else
            return !hostnames.some(i => host.startsWith(i));
    }

    return function (req: express.Request, res: express.Response, next: express.NextFunction) {
        console.log(req.headers.host);
        if (!req.headers.host)
            return res.status(400).end('No host specified');

        if (matches(req.headers.host))
            return app(req, res, next);
        else
            return next();

    }
}