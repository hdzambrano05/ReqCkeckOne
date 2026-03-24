const express = require('express');
const router = express.Router();
const userProjectsController = require('../controllers/user_projectsController');

// GET todos
router.get('/', userProjectsController.list);

// POST → añadir colaborador
router.post('/', userProjectsController.add);

// PUT → cambiar rol
router.put('/:user_id/:project_id', userProjectsController.update);

// DELETE → quitar colaborador
router.delete('/:user_id/:project_id', userProjectsController.delete);

module.exports = router;
