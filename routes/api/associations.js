const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');
const Profile = require('../../models/Profile');
const Association = require('../../models/Association');

// @route GET api/associations/
// @desc Get all association
// @access Private

router.get('/', auth, async (req, res) => {
  try {
    let profile = await Profile.findOne({ user: req.user.id });
    if (!profile) return res.status(400).json({ msg: 'No esta autorizado' });
    if (profile.createUnion) {
      const associations = await Association.find().populate('union', ['name']);
      return res.json(associations);
    }
    if (profile.createAssociation) {
      if (!profile.union)
        return res.status(400).json({
          msg: 'Su perfil debe tener una unión para visualizar las asociaciones'
        });
      const associations = await Association.find({
        union: profile.union
      }).populate('union', ['name']);
      return res.json(associations);
    }
    return res.status(400).json({ msg: 'No esta autorizado' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error del servidor');
  }
});

// @route POST api/association/
// @desc Create association
// @access Private
router.post(
  '/',
  [
    auth,
    [
      check('name', 'Debe ingresar el nombre de la asociación ')
        .not()
        .isEmpty(),
      check('union', 'Debe ingresar la Union ').not().isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const { name, union } = req.body;
    const associationFields = {};
    if (name) associationFields.name = name;
    if (union) associationFields.union = union;
    associationFields.createdBy = req.user.id;
    try {
      let profile = await Profile.findOne({ user: req.user.id });
      if (!profile) return res.status(400).json({ msg: 'No esta autorizado' });
      if (profile.createUnion) {
        const association = new Association(associationFields);
        await association.save();
        return res.json(association);
      }
      if (profile.createAssociation) {
        if (!profile.union)
          return res.status(400).json({
            msg: 'Su perfil debe tener una union para poder añadir Asociaciones'
          });
        associationFields.union = profile.union;
        const association = new Association(associationFields);
        await association.save();
        return res.json(association);
      }
      return res.status(400).json({ msg: 'No esta autorizado' });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Error del servidor');
    }
  }
);

// @route GET api/association/:association_id
// @desc Get a specific association by id
// @access Private
router.get('/:association_id', auth, async (req, res) => {
  try {
    let profile = await Profile.findOne({ user: req.user.id });
    if (!profile) return res.status(400).json({ msg: 'No esta autorizado' });
    if (profile.createUnion) {
      const association = await Association.findOne({
        _id: req.params.association_id
      })
        .populate('createdBy', ['name'])
        .populate('updatedBy', ['name'])
        .populate('union', ['name']);
      if (!association)
        return res.status(400).json({ msg: 'Esta asociación no existe' });
      res.json(association);
    }
    if (profile.createAssociation) {
      if (!profile.union)
        return res.status(400).json({
          msg: 'Su perfil debe tener una unión '
        });

      const association = await Association.findOne({
        _id: req.params.association_id
      })
        .populate('createdBy', ['name'])
        .populate('updatedBy', ['name'])
        .populate('union', ['name']);
      if (!association)
        return res
          .status(400)
          .json({ msg: 'Esta asociación no existe en su unión ' });
      if (profile.union.equals(association.union._id))
        return res.json(association);
    }
    return res.status(400).json({ msg: 'No esta autorizado' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error en el servidor');
  }
});

// @route PUT api/association/:association_id
// @desc Update association by Id
// @access Private
router.put(
  '/:association_id',
  [
    auth,
    [
      check('name', 'Debe ingresar el nombre de la asociación ')
        .not()
        .isEmpty(),
      check('union', 'Debe ingresar la Union ').not().isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const { name, union } = req.body;
    const associationFields = {};
    if (name) associationFields.name = name;
    if (union) associationFields.union = union;
    associationFields.updatedBy = req.user.id;
    associationFields.updatedDate = Date.now();
    try {
      let profile = await Profile.findOne({ user: req.user.id });
      if (!profile) return res.status(400).json({ msg: 'No esta autorizado' });
      if (profile.createUnion) {
        const association = await Association.findOneAndUpdate(
          { _id: req.params.association_id },
          { $set: associationFields },
          { new: true }
        )
          .populate('createdBy', ['name'])
          .populate('updatedBy', ['name'])
          .populate('union', ['name']);

        return res.json(association);
      }
      if (profile.createAssociation) {
        if (!profile.union)
          return res.status(400).json({
            msg:
              'Su perfil debe tener una union para poder actualizar Asociaciones'
          });

        // Find association but don't update it
        let assoc = await Association.findOne({
          _id: req.params.association_id
        });
        // Check if the user if it's trying to update an association from another union
        if (profile.union.equals(assoc.union)) {
          const association = await Association.findOneAndUpdate(
            { _id: req.params.association_id },
            { $set: associationFields },
            { new: true }
          )
            .populate('createdBy', ['name'])
            .populate('updatedBy', ['name'])
            .populate('union', ['name']);

          return res.json(association);
        }
      }
      return res.status(400).json({ msg: 'No esta autorizado' });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Error del servidor');
    }
  }
);

// @route Delete api/association/:association_id
// @desc Delete specific association
// @access Private

router.delete('/:association_id', auth, async (req, res) => {
  try {
    let profile = await Profile.findOne({ user: req.user.id });
    if (!profile) return res.status(400).json({ msg: 'No esta autorizado' });
    if (profile.createUnion) {
      await Association.findOneAndDelete(
        { _id: req.params.association_id },
        function (err, docs) {
          if (err) {
            console.log(err);
          } else {
            console.log('Deleted Association: ', docs);
          }
        }
      );
      return res.json({ msg: 'Asociación eliminada' });
    }
    if (profile.createAssociation) {
      if (!profile.union)
        return res.status(400).json({
          msg: 'Su perfil debe tener una union para poder eliminar Asociaciones'
        });
      // Find association but don't delete it
      let assoc = await Association.findOne({
        _id: req.params.association_id
      });
      // Check if the user if it's trying to delete an association from another union
      if (profile.union.equals(assoc.union)) {
        await Association.findOneAndDelete(
          { _id: req.params.association_id },
          function (err, docs) {
            if (err) {
              console.log(err);
            } else {
              console.log('Deleted Association: ', docs);
            }
          }
        );
        return res.json({ msg: 'Asociación eliminada' });
      }
    }
    return res.status(400).json({ msg: 'No esta autorizado' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error en el servidor');
  }
});

module.exports = router;
