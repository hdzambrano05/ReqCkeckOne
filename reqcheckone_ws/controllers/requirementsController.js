const axios = require("axios");
const { Op } = require('sequelize');
const requirements = require('../models').requirements_model;
const projects = require('../models').projects_model;
const users = require('../models').users_model;
const comments = require('../models').comments_model;
const requirement_history = require('../models').requirement_history_model;


module.exports = {

    list(req, res) {
        return requirements
            .findAll({})
            .then((requirement) => res.status(200).send(requirement))
            .catch((error) => { res.status(400).send(error); });
    },

    listfull(req, res) {
        return requirements.findAll({
            include: [
                {
                    model: projects,
                },
                {
                    attributes: ['username'],
                    model: users,
                },
            ]
        })
            .then(requirements => res.status(200).send(requirements))
            .catch(error => res.status(400).send(error));
    },

    async listByProject(req, res) {
        try {
            const { projectId } = req.params;

            const requirementsList = await requirements.findAll({
                where: {
                    project_id: projectId,
                    status: { [Op.ne]: 'eliminado' } // 👈 Excluir los requisitos eliminados
                },
                order: [['created_at', 'DESC']]
            });

            return res.status(200).send(requirementsList);
        } catch (error) {
            console.error("❌ Error en listByProject:", error);
            return res.status(400).send(error);
        }
    },

    getById(req, res) {
        return requirements
            .findByPk(req.params.id)
            .then((requirement) => {
                if (!requirement) {
                    return res.status(404).send({ message: 'Requirement Not Found' });
                }

                let parsedAnalysis = null;
                try {
                    parsedAnalysis = JSON.parse(requirement.analysis);
                } catch {
                    parsedAnalysis = requirement.analysis; // Si ya es objeto
                }

                return res.status(200).send({
                    ...requirement.toJSON(),
                    analysis: parsedAnalysis
                });
            })
            .catch((error) => res.status(400).send(error));
    },

    async analyze(req, res) {
        try {
            console.log("Petición recibida en Node.js:", req.body);

            const requirement = {
                id: req.body.id?.trim().length > 0 ? req.body.id : `TEMP-${Date.now()}`,
                project_id: Number(req.body.project_id),
                text: req.body.text,
                descripcion_proyecto: req.body.descripcion_proyecto, // 👈 CORREGIDO
            };

            // Validar antes de enviar a FastAPI
            if (!requirement.descripcion_proyecto || requirement.descripcion_proyecto.trim().length < 10) {
                return res.status(400).send({
                    status: "error",
                    message: "La descripción del proyecto es demasiado corta para realizar el análisis."
                });
            }

            const response = await axios.post(
                "http://127.0.0.1:8000/analyze",
                requirement,
                { headers: { "Content-Type": "application/json" } }
            );

            console.log("Respuesta de FastAPI:", response.data);
            return res.status(200).send(response.data);

        } catch (error) {
            console.error("Error en analyze Node.js:", error.message);

            if (error.response) {
                console.error("Status FastAPI:", error.response.status);
                console.error("Data FastAPI:", error.response.data);
                return res.status(error.response.status).send(error.response.data);
            }

            return res.status(500).send({ error: "Error al analizar el requisito" });
        }
    },

    add(req, res) {
        const payload = {
            project_id: req.body.project_id,
            title: req.body.title,
            text: req.body.text,
            context: req.body.context,
            status: req.body.status || 'draft',
            priority: req.body.priority || 'medium',
            due_date: req.body.due_date,
            version: req.body.version || 1,
            analysis: JSON.stringify(req.body.analysis),
            created_by: req.body.created_by
        };

        requirements.create(payload)
            .then(saved => res.status(201).send(saved))
            .catch(error => res.status(400).send(error));
    },


    async update(req, res) {
        try {
            const requirement = await requirements.findByPk(req.params.id);

            if (!requirement) {
                return res.status(404).send({ message: "Requirement Not Found" });
            }

            // 🧩 Guardar la versión anterior en historial
            await requirement_history.create({
                requirement_id: requirement.id,
                version: requirement.version,
                text: requirement.text,
                context: requirement.context,
                analysis: requirement.analysis,
                changed_by: req.body.changed_by || null,
            });

            // 💾 Actualizar directamente con los datos nuevos
            const updated = await requirement.update({
                project_id: req.body.project_id || requirement.project_id,
                title: req.body.title || requirement.title,
                text: req.body.text || requirement.text,
                context: req.body.context || requirement.context,
                status: req.body.status || requirement.status,
                priority: req.body.priority || requirement.priority,
                due_date: req.body.due_date || requirement.due_date,
                version: (requirement.version || 1) + 1,
                analysis: req.body.analysis ? JSON.stringify(req.body.analysis) : requirement.analysis,
                created_by: req.body.created_by || requirement.created_by,
                updated_at: new Date(),
            });

            console.log("✅ Requisito actualizado correctamente (sin reanalizar).");
            return res.status(200).send(updated);

        } catch (error) {
            console.error("❌ Error actualizando requisito:", error.message);
            return res.status(400).send({
                message: "Error actualizando el requisito",
                error: error.message,
            });
        }
    },

    async delete(req, res) {
        try {
            const id = req.params.id;
            const userId = req.user?.id || null;

            const requirement = await requirements.findByPk(id);
            if (!requirement) {
                return res.status(404).send({ message: 'Requirement not found' });
            }

            console.log('🧠 Eliminado por usuario:', req.user);

            // ✅ Marcar como eliminado (sin borrar de la BD)
            requirement.status = 'eliminado';
            await requirement.save();

            // ✅ Guardar el cambio en el historial
            await requirement_history.create({
                requirement_id: requirement.id,
                version: requirement.version,
                text: requirement.text,
                context: requirement.context,
                analysis: requirement.analysis,
                changed_by: userId,
                updated_at: new Date(),
            });

            console.log('✅ Historial guardado correctamente');
            return res.status(200).send({ message: 'Requisito marcado como eliminado' });

        } catch (error) {
            console.error('❌ Error al eliminar requisito:', error);
            return res.status(500).send({
                message: 'Error al eliminar el requisito',
                error: error.message,
            });
        }
    }


};