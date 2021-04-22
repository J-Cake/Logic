import path from 'path';

import express from 'express';
import MarkdownIt from 'markdown-it';

import {rootFn} from '../util/utils';
import * as FS from '../util/files';
import {isLoggedIn} from './Auth/UserActions';

const router: express.Router = express.Router();

router.get('/', function (req, res) {
    res.render('site/home', {
        title: "LogicX",
        isLoggedIn: isLoggedIn(req)
    });
});
router.get('/license', function (req, res) {
    res.render('site/license', {
        title: "LogicX License",
        isLoggedIn: isLoggedIn(req)
    });
});

export default router;