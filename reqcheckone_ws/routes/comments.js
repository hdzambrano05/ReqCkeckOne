var express = require('express');
var router = express.Router();
const commentsController = require('../controllers').commentsController;

router.get('/', commentsController.list);
router.get('/:id', commentsController.getById);
router.post('/', commentsController.add);
router.put('/:id', commentsController.update);
router.delete('/:id', commentsController.delete);

module.exports = router;