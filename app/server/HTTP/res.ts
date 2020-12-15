import {Router} from 'express';

const router = Router();

router.get("/icon/:name", function (req, res) {
    res.status(404);
    res.end("Does not exist");
})

export default router;