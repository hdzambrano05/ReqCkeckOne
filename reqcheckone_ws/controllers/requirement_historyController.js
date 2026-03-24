const requirement_history = require('../models').requirement_history_model;
const projects = require('../models').projects_model;
const requirements = require('../models').requirements_model;
const user_projects = require('../models').user_projects_model;
const users = require('../models').users_model;

module.exports = {

    list(req, res) {
        return requirement_history
            .findAll({
                order: [['updated_at', 'DESC']] // los más recientes primero
            })
            .then((history) => res.status(200).send(history))
            .catch((error) => res.status(400).send(error));
    },

    async listByUser(req, res) {
        try {
            const userId = req.user.id;

            const ownedProjects = await projects.findAll({
                where: { owner_id: userId },
                attributes: ['id']
            });

            const sharedProjects = await user_projects.findAll({
                where: { user_id: userId },
                attributes: ['project_id']
            });

            const projectIds = [
                ...new Set([
                    ...ownedProjects.map(p => p.id),
                    ...sharedProjects.map(p => p.project_id)
                ])
            ];

            if (projectIds.length === 0) {
                return res.status(200).json([]);
            }

            const userRequirements = await requirements.findAll({
                where: { project_id: projectIds },
                attributes: ['id', 'title', 'project_id']
            });

            const requirementIds = userRequirements.map(r => r.id);
            if (requirementIds.length === 0) {
                return res.status(200).json([]);
            }

            // 🔹 Aquí está el cambio importante
            const history = await requirement_history.findAll({
                where: { requirement_id: requirementIds },
                order: [['updated_at', 'DESC']],
                include: [
                    {
                        model: requirements,
                        as: 'requirement', // usa alias consistente con el frontend
                        attributes: ['id', 'title', 'project_id'],
                        include: [
                            {
                                model: projects,
                                as: 'project', // alias consistente
                                attributes: ['id', 'name']
                            }
                        ]
                    },
                    {
                        model: users,
                        as: 'changer',
                        attributes: ['username']
                    }
                ]
            });

            return res.status(200).json(history);
        } catch (error) {
            console.error('❌ Error en listByUser:', error);
            return res.status(500).send(error);
        }
    },

    // 🔹 Listar historial por un requisito específico
    async getByRequirement(req, res) {
        try {
            const { id } = req.params;
            const history = await requirement_history.findAll({
                where: { requirement_id: id },
                include: [
                    { model: users, as: "changer", attributes: ["id", "username"] },
                    {
                        model: requirements,
                        include: [{ model: projects }],
                    },
                ],
                order: [["updated_at", "DESC"]],
            });

            res.status(200).json(history);
        } catch (error) {
            console.error("❌ Error en getByRequirement:", error);
            res.status(500).send(error);
        }
    },


    getById(req, res) {
        return requirement_history
            .findByPk(req.params.id)
            .then((requirement_history) => {
                if (!requirement_history) {
                    return res.status(404).send({
                        message: 'Requirement History Not Found',
                    });
                }
                return res.status(200).send(requirement_history);
            })
            .catch((error) => res.status(400).send(error));
    },

    getByRequirement(req, res) {
        return requirement_history
            .findAll({ where: { requirement_id: req.params.id } })
            .then(history => res.status(200).send(history))
            .catch(error => res.status(400).send(error));
    },


    add(req, res) {
        return requirement_history
            .create({
                requirement_id: req.body.requirement_id,
                version: req.body.version,
                text: req.body.text,
                context: req.body.context,
                analysis: req.body.analysis,
                changed_by: req.body.changed_by,

            })
            .then((requirement_history) => res.status(201).send(requirement_history))
            .catch((error) => res.status(400).send(error));
    },

    update(req, res) {
        return requirement_history
            .findByPk(req.params.id)
            .then(requirement_history => {
                if (!requirement_history) {
                    return res.status(404).send({
                        message: 'Requirement History Not Found',
                    });
                }
                return requirement_history
                    .update({
                        requirement_id: req.body.requirement_id || requirement_history.requirement_id,
                        version: req.body.version || requirement_history.version,
                        text: req.body.text || requirement_history.text,
                        context: req.body.context || requirement_history.context,
                        analysis: req.body.analysis || requirement_history.analysis,
                        changed_by: req.body.changed_by || requirement_history.changed_by,
                    })
                    .then(() => res.status(200).send(requirement_history))  // Send back the updated requirement_history.
                    .catch((error) => res.status(400).send(error));
            })
            .catch((error) => res.status(400).send(error));
    },

    delete(req, res) {
        return requirement_history
            .findByPk(req.params.id)
            .then(requirement_history => {
                if (!requirement_history) {
                    return res.status(404).send({
                        message: 'Requirement History Not Found',
                    });
                }
                return requirement_history
                    .destroy()
                    .then(() => res.status(204).send()) // Send back a 204 No Content status
                    .catch((error) => res.status(400).send(error));
            })
            .catch((error) => res.status(400).send(error));
    },
};