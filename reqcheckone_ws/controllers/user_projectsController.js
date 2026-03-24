const user_projects = require('../models').user_projects_model;
const users = require('../models').users_model;

module.exports = {
    /** Listar todos */
    list(req, res) {
        return user_projects.findAll({ include: ['user', 'project'] })
            .then(data => res.status(200).send(data))
            .catch(err => res.status(400).send(err));
    },

    /** Agregar colaborador a un proyecto */
    async add(req, res) {
        try {
            const { user_id, project_id, role } = req.body;

            const newCol = await user_projects.create({
                user_id,
                project_id,
                role: role || 'member'
            });

            return res.status(201).send(newCol);
        } catch (error) {
            return res.status(400).send(error);
        }
    },

    /** Cambiar rol de colaborador */
    async update(req, res) {
        try {
            const { user_id, project_id } = req.params;
            const { role } = req.body;

            const record = await user_projects.findOne({
                where: { user_id, project_id }
            });

            if (!record) return res.status(404).send({ message: "Colaborador no encontrado" });

            record.role = role || record.role;
            await record.save();

            return res.status(200).send(record);
        } catch (error) {
            return res.status(400).send(error);
        }
    },

    /** Eliminar colaborador de un proyecto */
    async delete(req, res) {
        try {
            const { user_id, project_id } = req.params;

            const record = await user_projects.findOne({
                where: { user_id, project_id }
            });

            if (!record) return res.status(404).send({ message: "Colaborador no encontrado" });

            await record.destroy();
            return res.status(204).send();
        } catch (error) {
            return res.status(400).send(error);
        }
    }
};
