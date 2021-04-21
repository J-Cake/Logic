import type express from "express";
import {verifyUser} from "../../App/Auth/UserActions";

export default function authenticate() {
    return async function (req: express.Request, res: express.Response, next: express.NextFunction) {
        const userToken = req.userToken = req.header('auth-token') ?? (typeof req.query['auth-token'] === 'string' ? req.query['auth-token'] as string : '');

        if (!userToken || !await verifyUser(userToken)) {
            res.status(401);
            res.end('Unverified request');
        } else next();
    }
}