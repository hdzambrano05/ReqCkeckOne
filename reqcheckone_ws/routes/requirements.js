var express = require('express');
var router = express.Router();
const requirementsController = require('../controllers').requirementsController;
const authMiddleware = require('../middleware/auth');

router.get('/', authMiddleware, requirementsController.list);
router.get('/full', authMiddleware, requirementsController.listfull);
router.get('/:id', authMiddleware, requirementsController.getById);
router.get('/project/:projectId', authMiddleware, requirementsController.listByProject);
router.post('/analyze', requirementsController.analyze);
router.post('/', authMiddleware, requirementsController.add);
router.put('/:id', authMiddleware, requirementsController.update);
router.delete('/:id', authMiddleware, requirementsController.delete);

module.exports = router;    