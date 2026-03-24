
const tasks = require('../models').tasks_model;
const projects = require('../models').projects_model;
const users = require('../models').users_model;
const requirements = require('../models').requirements_model;

module.exports = {

    list(req, res) {
        return tasks
            .findAll({})
            .then((tasks) => res.status(200).send(tasks))
            .catch((error) => { res.status(400).send(error); });
    },

    getById(req, res) {

        console.log(req.params.id);
        return tasks
            .findByPk(req.params.id)
            .then((tasks) => {
                console.log(tasks);
                if (!tasks) {
                    return res.status(404).send({
                        message: 'tasks Not Found',
                    });
                }
                return res.status(200).send(tasks);
            })
            .catch((error) =>
                res.status(400).send(error));
    },

    add(req, res) {
        return tasks
            .create({
                project_id: req.body.project_id,
                requirement_id: req.body.requirement_id,
                title: req.body.title,
                description: req.body.description,
                status: req.body.status || 'pending',
                priority: req.body.priority,
                assignee_id: req.body.assignee_id,
                assigned_to: req.body.assigned_to,
                due_date: req.body.due_date,
            })
            .then((tasks) => res.status(201).send(tasks))
            .catch((error) => res.status(400).send(error));
    },
    update(req, res) {
        return tasks
            .findByPk(req.params.id)
            .then(tasks => {
                if (!tasks) {
                    return res.status(404).send({
                        message: 'tasks Not Found',
                    });
                }
                return tasks
                    .update({
                        project_id: req.body.project_id || tasks.project_id,
                        requirement_id: req.body.requirement_id || tasks.requirement_id,
                        title: req.body.title || tasks.title,
                        description: req.body.description || tasks.description,
                        status: req.body.status || tasks.status,
                        priority: req.body.priority || tasks.priority,
                        assignee_id: req.body.assignee_id || tasks.assignee_id,
                        assigned_to: req.body.assigned_to || tasks.assigned_to,
                        due_date: req.body.due_date || tasks.due_date,
                    })
                    .then(() => res.status(200).send(tasks))
                    .catch((error) => res.status(400).send(error));
            }
            )
            .catch((error) => res.status(400).send(error));
    },

    delete(req, res) {
        return tasks
            .findByPk(req.params.id)
            .then(tasks => {
                if (!tasks) {
                    return res.status(404).send({
                        message: 'tasks Not Found',
                    });
                }
                return tasks
                    .destroy()
                    .then(() => res.status(204).send())
                    .catch((error) => res.status(400).send(error));
            })
            .catch((error) => res.status(400).send(error));
    },

    getByProject(req, res) {
        const { projectId } = req.params;

        return tasks
            .findAll({
                where: { project_id: projectId },
                include: [
                    {
                        model: projects,
                        as: 'project',
                        attributes: ['id', 'name', 'description'],
                    },
                    {
                        model: users,
                        as: 'assignedUser',
                        attributes: ['id', 'username', 'email'],
                        required: false, // 👈 Esto evita que excluya tareas sin asignar
                    },
                    {
                        model: requirements,
                        as: 'requirement',
                        attributes: ['id', 'title'],
                        required: false,
                    },
                ],
                order: [['created_at', 'DESC']],
            })
            .then((tasksList) => {
                console.log('📋 Tareas:', JSON.stringify(tasksList, null, 2)); // 👈 Revisa aquí el alias que llega
                res.status(200).send(tasksList);
            })
            .catch((error) => {
                console.error('❌ Error al obtener tareas por proyecto:', error);
                res.status(400).send(error);
            });
    },


    respondTask(req, res) {
        const { id } = req.params;
        const { accept } = req.body; // true = acepta, false = rechaza
        const userId = req.user.id; // asumimos que tienes auth middleware

        return tasks.findByPk(id)
            .then(task => {
                if (!task) return res.status(404).send({ message: 'Task not found' });
                if (task.assignee_id !== userId) return res.status(403).send({ message: 'No eres asignado a esta tarea' });
                if (task.status !== 'pending') return res.status(400).send({ message: 'Tarea ya fue respondida' });

                task.status = accept ? 'accepted' : 'rejected';

                return task.save()
                    .then(updatedTask => {
                        // Notificar al creador
                        // notify(task.project.owner_id, `El colaborador ${accept ? 'aceptó' : 'rechazó'} la tarea "${task.title}"`);
                        res.status(200).send({ message: 'Respuesta registrada', task: updatedTask });
                    });
            })
            .catch(error => res.status(400).send(error));
    }

}

