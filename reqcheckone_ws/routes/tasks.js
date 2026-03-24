var express = require('express');
var router = express.Router();
const tasksController = require('../controllers').tasksController;
const authMiddleware = require('../middleware/auth');

router.get('/',authMiddleware,tasksController.list);
router.get('/:id',authMiddleware, tasksController.getById);
router.post('/',authMiddleware, tasksController.add);
router.put('/:id',authMiddleware, tasksController.update);
router.delete('/:id',authMiddleware, tasksController.delete);
router.get('/project/:projectId',authMiddleware, tasksController.getByProject);
router.patch('/:id/respond',authMiddleware, tasksController.respondTask);

module.exports = router;

