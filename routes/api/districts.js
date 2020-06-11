const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const mongo = require('mongodb');
const { check, validationResult } = require('express-validator');
const Profile = require('../../models/Profile');
const District = require('../../models/District');
const Association = require('../../models/Association');

// @route GET api/districts/
// @desc Get all Districts
// @access Private

router.get('/', auth, async (req, res) => {
  try {
    let profile = await Profile.findOne({ user: req.user.id });

    if (!profile) return res.status(400).json({ msg: 'No está autorizado' });

    if (profile.createUnion) {
      const district = await District.find()
        .populate('association', ['name'])
        .populate('createdBy', ['name'])
        .populate('updatedBy', ['name']);
      return res.json(district);
    }

    if (profile.createAssociation) {
      if (!profile.union)
        return res.status(400).json({
          msg: 'Su perfil debe tener una unión para visualizar los distritos'
        });
      let district = await District.aggregate([
        {
          $lookup: {
            from: 'associations',
            localField: 'association',
            foreignField: '_id',
            as: 'association'
          }
        },
        { $unwind: '$association' },
        { $match: { 'association.union': profile.union } },
        {
          $lookup: {
            from: 'users',
            localField: 'createdBy',
            foreignField: '_id',
            as: 'createdBy'
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'updatedBy',
            foreignField: '_id',
            as: 'updatedBy'
          }
        },
        {
          $project: {
            _id: 1,
            name: 1,
            'association._id': 1,
            'association.name': 1,
            'createdBy._id': 1,
            'createdBy.name': 1,
            date: 1,
            'updatedBy._id': 1,
            'updatedBy.name': 1,
            updatedDate: 1
          }
        }
      ]);
      return res.json(district);
    }

    if (profile.createDistrict) {
      if (!profile.association)
        return res.status(400).json({
          msg:
            'Su perfil debe tener una asociación para visualizar los distritos'
        });
      let district = await District.find({ association: profile.association });
      return res.json(district);
    }
    return res.status(400).json({ msg: 'No está autorizado' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error del servidor');
  }
});

// @route POST api/districts/
// @desc create district
// @access Private

router.post(
  '/',
  [
    auth,
    [
      check('name', 'Debe ingresar el nombre del distrito').not().isEmpty(),
      check('association', 'Debe ingresar la asociación del distrito')
        .not()
        .isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const districtFields = {};
    const { name, association } = req.body;
    if (name) districtFields.name = name;
    if (association) districtFields.association = association;
    try {
      let profile = await Profile.findOne({ user: req.user.id });

      if (
        profile.createUnion ||
        profile.createAssociation ||
        profile.createDistrict
      ) {
        // Check if the association exists
        let associationCheck = await Association.findOne({
          _id: association
        });

        if (!association)
          return res.status(400).json({ msg: 'Ingrese una asociación válida' });

        if (profile.createAssociation) {
          if (!associationCheck.union.equals(profile.union))
            return res.status(400).json({
              msg: 'Ingrese una asociación que pertenezca a su unión'
            });
        }

        if (profile.createDistrict) {
          if (!profile.association)
            return res.status(400).json({
              msg: 'Su perfil debe tener una asociación para añadir distritos'
            });
          if (profile.association !== association)
            districtFields.association = profile.association;
        }

        districtFields.createdBy = req.user.id;
        const district = new District(districtFields);
        await district.save();
        return res.json(district);
      }

      return res.status(400).json({ msg: 'No está autorizado' });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Error en el servidor');
    }
  }
);

// @route GET api/districts/:district_id
// @desc Get a specific district by id
// @access Private
router.get('/:district_id', auth, async (req, res) => {
  try {
    let profile = await Profile.findOne({ user: req.user.id });
    if (!profile) return res.status(400).json({ msg: 'No está autorizado' });
    if (
      profile.createUnion ||
      profile.createAssociation ||
      profile.createDistrict
    ) {
      const district = await District.findOne({
        _id: req.params.district_id
      })
        .populate('createdBy', ['name'])
        .populate('updatedBy', ['name'])
        .populate('association', ['name', 'union']);
      if (!district)
        return res.status(400).json({ msg: 'Este distrito no existe' });

      if (
        (!profile.union && profile.createAssociation) ||
        (profile.createAssociation &&
          !profile.union.equals(district.association.union))
      )
        return res
          .status(400)
          .json({ msg: 'Este distrito no pertenece a su unión' });
      if (
        (!profile.association && profile.createDistrict) ||
        (profile.createDistrict &&
          !profile.association.equals(district.association._id))
      )
        return res
          .status(400)
          .json({ msg: 'Este distrito no pertenece a su asociación' });
      res.json(district);
    }
    return res.status(400).json({ msg: 'No está autorizado' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error en el servidor');
  }
});

// @route PUT api/districts/:district_id
// @desc Update specific district by id
// @access Private

router.put(
  '/:district_id',
  [
    auth,
    [
      check('name', 'Debe ingresar el nombre del distrito').not().isEmpty(),
      check('association', 'Debe ingresar la asociación del distrito')
        .not()
        .isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const districtFields = {};
    const { name, association } = req.body;
    if (name) districtFields.name = name;
    if (association) districtFields.association = association;
    try {
      let profile = await Profile.findOne({ user: req.user.id });
      if (!profile)
        return res
          .status(400)
          .json({ msg: 'Debe tener un perfil para crear distritos' });

      if (
        profile.createUnion ||
        profile.createAssociation ||
        profile.createDistrict
      ) {
        // Check if the association exists
        let associationCheck = await Association.findOne({
          _id: association
        });

        let districtChek = await District.findOne({
          _id: req.params.district_id
        }).populate('association', ['name', 'union']);
        if (!association)
          return res.status(400).json({ msg: 'Ingrese una asociación válida' });

        if (profile.createAssociation) {
          if (!profile.union)
            return res.status(400).json({
              msg: 'Su perfil debe tener una unión para actualizar distritos'
            });
          if (!profile.union.equals(districtChek.association.union))
            return res.status(400).json({
              msg: 'Usted no está autorizado'
            });
          if (!associationCheck.union.equals(profile.union))
            return res.status(400).json({
              msg: 'Ingrese una asociación que pertenezca a su unión'
            });
        }

        if (profile.createDistrict) {
          if (!profile.association)
            return res.status(400).json({
              msg:
                'Su perfil debe tener una asociación para actualizar distritos'
            });
          if (!profile.association.equals(districtChek.association._id))
            return res.status(400).json({
              msg: 'Usted no está autorizado'
            });
          if (profile.association !== association)
            return res.status(400).json({
              msg: 'Usted no pertenece a la asociación que ingresó'
            });
        }

        districtFields.updatedBy = req.user.id;
        districtFields.updatedDate = Date.now();
        const district = await District.findOneAndUpdate(
          { _id: req.params.district_id },
          { $set: districtFields },
          { new: true }
        )
          .populate('createdBy', ['name'])
          .populate('updatedBy', ['name'])
          .populate('association', ['name']);

        return res.json(district);
      }

      return res.status(400).json({ msg: 'No está autorizado' });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Error en el servidor');
    }
  }
);

// @route DELETE api/districts/:district_id
// @desc Delete specific district by id
// @access Private

router.delete('/:district_id', auth, async (req, res) => {
  try {
    let profile = await Profile.findOne({ user: req.user.id });
    if (!profile) return res.status(400).json({ msg: 'No está autorizado' });
    if (
      profile.createUnion ||
      profile.createAssociation ||
      profile.createDistrict
    ) {
      let districtChek = await District.findOne({
        _id: req.params.district_id
      }).populate('association', ['name', 'union']);
      if (!districtChek)
        return res.status(400).json({ msg: 'No hay distrito para eliminar' });

      if (profile.createAssociation) {
        if (!profile.union)
          return res.status(400).json({
            msg: 'Su perfil debe tener una unión para eliminar distritos'
          });
        if (!profile.union.equals(districtChek.association.union))
          return res.status(400).json({
            msg: 'Usted no está autorizado'
          });
      }

      if (profile.createDistrict) {
        if (!profile.association)
          return res.status(400).json({
            msg: 'Su perfil debe tener una asociación para eliminar distritos'
          });
        if (!profile.association.equals(districtChek.association._id))
          return res.status(400).json({
            msg: 'Usted no está autorizado'
          });
      }

      await District.findOneAndDelete(
        { _id: req.params.district_id },
        function (err, docs) {
          if (err) {
            console.log(err);
          } else {
            console.log('Delete District: ', docs);
          }
        }
      );
      return res.json({ msg: 'Distrito eliminado' });
    }
    return res.status(400).json({ msg: 'No está autorizado' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error en el servidor');
  }
});

module.exports = router;
