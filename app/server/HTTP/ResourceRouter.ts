import * as fs from 'fs';
import * as path from 'path';

import * as express from 'express';

import {rootFn} from "../utils";
import renderIcon from "../icon/renderIcon";

const router = express.Router();

router.get('/icon/:icon', function (req, res) {
    const file = path.join(rootFn(__dirname), 'app', 'icons', 'dyn', req.params['icon'] + '.dif');

    if (fs.existsSync(file)) {
        res.status(200);
        res.contentType('image/svg+xml');

        try {
            res.end(renderIcon(fs.readFileSync(file, 'utf8')));
        } catch (err) {
            console.error(err);
            res.status(500);
            res.contentType('text/plain');
            res.end('Invalid syntax in icon');
        }
    } else {
        res.status(404);
        res.contentType('text/plain');
        res.end('The file doesn\'t exist')
    }
});

export default router;