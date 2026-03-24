
const express = require('express');
const router = express.Router();
const requirement_historyController = require('../controllers').requirement_historyController;
const authMiddleware = require('../middleware/auth');

// ✅ Listar historial SOLO de los proyectos del usuario logueado
router.get('/user', authMiddleware, requirement_historyController.listByUser);

// ✅ Listar historial de un requisito específico
router.get('/requirement/:id', authMiddleware, requirement_historyController.getByRequirement);

// ✅ (Opcional) Obtener historial individual por ID
router.get('/:id', authMiddleware, requirement_historyController.getById);

// ✅ (Opcional, si agregas desde el backend manualmente)
router.post('/', authMiddleware, requirement_historyController.add);

// ✅ (Opcional)
router.put('/:id', authMiddleware, requirement_historyController.update);

// ✅ (Opcional)
router.delete('/:id', authMiddleware, requirement_historyController.delete);

module.exports = router;

