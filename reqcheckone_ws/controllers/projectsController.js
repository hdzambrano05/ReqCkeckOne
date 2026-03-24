const { Op } = require('sequelize');
const projects = require('../models').projects_model;
const users = require('../models').users_model;
const user_projects = require('../models').user_projects_model;
const requirements = require('../models').requirements_model;
const tasks = require('../models').tasks_model;
const comments = require('../models').comments_model;


module.exports = {

    list(req, res) {
        return projects
            .findAll({})
            .then((project) => res.status(200).send(project))
            .catch((error) => { res.status(400).send(error); });
    },

    listUserProjects(req, res) {
        const userId = req.user?.id;
        if (!userId) return res.status(401).send({ message: 'Usuario no encontrado en token' });

        return projects.findAll({
            where: { owner_id: userId } // solo los proyectos que posee el usuario
        })
            .then(projects => res.status(200).send(projects))
            .catch(error => {
                console.error(error);
                res.status(400).send(error);
            });
    },

    async listUserProjects(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).send({ message: 'Usuario no encontrado en token' });
            }

            // Proyectos donde es dueño
            const userProjects = await projects.findAll({
                where: { owner_id: userId },
                attributes: ['id', 'name', 'description', 'status', 'deadline', 'owner_id'],
                include: [
                    {
                        model: users,
                        as: 'collaborators',
                        attributes: ['id', 'username', 'email'], // evita traer password
                        through: {
                            attributes: ['role'] // ✅ role viene de la tabla intermedia user_projects
                        },
                        required: false
                    }
                ]
            });

            // Proyectos donde es colaborador
            const collaboratorProjects = await projects.findAll({
                attributes: ['id', 'name', 'description', 'status', 'deadline', 'owner_id'],
                include: [
                    {
                        model: users,
                        as: 'collaborators',
                        through: { attributes: ['role'] },
                        required: true,
                        where: { id: userId }
                    }
                ]
            });

            // Unir sin duplicar
            const allProjects = [...userProjects, ...collaboratorProjects].reduce(
                (acc, proj) => {
                    if (!acc.some(p => p.id === proj.id)) acc.push(proj);
                    return acc;
                },
                []
            );

            return res.status(200).send(allProjects);
        } catch (error) {
            console.error(error);
            return res.status(400).send(error);
        }
    },


    async getById(req, res) {
        try {
            const project = await projects.findByPk(req.params.id, {
                attributes: ['id', 'name', 'description', 'status', 'deadline', 'owner_id'],
                include: [
                    {
                        model: users,
                        as: 'owner',  // 🔹 Incluye al creador
                        attributes: ['id', 'username', 'email']
                    },
                    {
                        model: users,
                        as: 'collaborators',
                        attributes: ['id', 'username', 'email'],
                        through: { attributes: ['role'] }
                    },
                ]
            });

            if (!project) {
                return res.status(404).send({ message: 'Project Not Found' });
            }

            return res.status(200).send(project);
        } catch (error) {
            console.error(error);
            return res.status(400).send(error);
        }
    },

    async add(req, res) {
        try {
            const { name, description, owner_id, status, deadline, collaborators } = req.body;

            // 1. Crear el proyecto
            const project = await projects.create({
                name,
                description,
                owner_id,
                status,
                deadline,
            });

            // 2. Agregar colaboradores iniciales
            if (Array.isArray(collaborators) && collaborators.length > 0) {
                const userProjects = collaborators.map(userId => ({
                    user_id: userId,
                    project_id: project.id,
                    role: 'member'
                }));

                await user_projects.bulkCreate(userProjects);
            }

            // 3. Retornar el proyecto con colaboradores incluidos
            const fullProject = await projects.findByPk(project.id, {
                include: [
                    {
                        model: users,
                        as: 'collaborators',
                        attributes: ['id', 'username', 'email'],
                        through: { attributes: ['role'] }
                    }
                ]
            });

            return res.status(201).send(fullProject);
        } catch (error) {
            console.error(error);
            return res.status(400).send({ error: error.message });
        }
    },


    update(req, res) {
        return projects
            .findByPk(req.params.id)
            .then(projects => {
                if (!projects) {
                    return res.status(404).send({
                        message: 'Project Not Found',
                    });
                }
                return projects
                    .update({
                        name: req.body.name || projects.name,
                        description: req.body.description || projects.description,
                        owner_id: req.body.owner_id || projects.owner_id,
                        status: req.body.status || projects.status,
                        deadline: req.body.deadline || projects.deadline,
                    })
                    .then(() => res.status(200).send(projects))  // Send back the updated project.
                    .catch((error) => res.status(400).send(error));
            })
            .catch((error) => res.status(400).send(error));
    },

    delete(req, res) {
        return projects
            .findByPk(req.params.id)
            .then(projects => {
                if (!projects) {
                    return res.status(400).send({
                        message: 'Project Not Found',
                    });
                }
                return projects
                    .destroy()
                    .then(() => res.status(204).send())  // No content to send back.
                    .catch((error) => res.status(400).send(error));
            })
            .catch((error) => res.status(400).send(error));
    },

};
