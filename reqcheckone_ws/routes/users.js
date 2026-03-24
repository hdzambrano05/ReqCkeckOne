var express = require('express');
var router = express.Router();
const usersController = require('../controllers').usersController;

router.get('/', usersController.list);
router.get('/full', usersController.listFull);
router.get('/:id', usersController.getById);
router.post('/login', usersController.login);
router.post('/', usersController.add);
router.put('/:id', usersController.update);
router.delete('/:id', usersController.delete);

module.exports = router;
