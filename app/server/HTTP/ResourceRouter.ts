import * as fs from 'fs';
import * as path from 'path';

import * as express from 'express';
import {rootFn} from "../utils";
import renderIcon from "../icon/renderIcon";

const router = express.Router();

router.get('icon/:icon-name', function (req, res) {
    const file = path.join(rootFn(__dirname), 'app', 'icons', 'dyn', req.params['icon-name']);
    if (fs.existsSync(file)) {
        res.status(200);
        res.contentType('image/svg+xml');

        try {
            res.end(renderIcon(fs.readFileSync(file, 'utf8')));
        } catch (err) {
            res.status(500);
            res.contentType('text/plain');
            res.end('Invalid syntax in icon');
        }
    }
});

export default router;