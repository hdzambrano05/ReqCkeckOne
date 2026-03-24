const { text } = require('express');

const comments = require('../models').comments_model;

module.exports = {

    list(req, res) {
        return comments
            .findAll({})
            .then((comment) => res.status(200).send(comment))
            .catch((error) => { res.status(400).send(error); });
    },

    getById(req, res) {

        console.log(req.params.id);
        return comments
            .findByPk(req.params.id)
            .then((comments) => {
                console.log(comments);
                if (!comments) {
                    return res.status(404).send({
                        message: 'comments Not Found',
                    });
                }
                return res.status(200).send(comments);
            })
            .catch((error) =>
                res.status(400).send(error));
    },

    add(req, res) {
        return comments
            .create({
                user_id: req.body.user_id,
                requirement_id: req.body.requirement_id,
                task_id: req.body.task_id,
                text: req.body.text,
            })
            .then((comments) => res.status(201).send(comments))
            .catch((error) => res.status(400).send(error));
    },

    update(req, res) {
        return comments
            .findByPk(req.params.id)
            .then(comments => {
                if (!comments) {
                    return res.status(404).send({
                        message: 'comments Not Found',
                    });
                }
                return comments
                    .update({
                        text: req.body.text || comments.text,
                    })
                    .then(() => res.status(200).send(comments))
                    .catch((error) => res.status(400).send(error));
            })
            .catch((error) => res.status(400).send(error));
    },

    delete(req, res) {
        return comments
            .findByPk(req.params.id)
            .then(comments => {
                if (!comments) {
                    return res.status(404).send({
                        message: 'comments Not Found',
                    });
                }
                return comments
                    .destroy()
                    .then(() => res.status(204).send())
                    .catch((error) => res.status(400).send(error));
            })
            .catch((error) => res.status(400).send(error));
    },



};