var express = require('express');
var router = express.Router();
const projectsController = require('../controllers/projectsController');
const authMiddleware = require('../middleware/auth');

router.get('/', authMiddleware, projectsController.list);
router.get('/my', authMiddleware, projectsController.listUserProjects);
router.get('/:id', authMiddleware, projectsController.getById);
router.post('/', authMiddleware, projectsController.add);
router.put('/:id', authMiddleware, projectsController.update);
router.delete('/:id', authMiddleware, projectsController.delete);

module.exports = router;
