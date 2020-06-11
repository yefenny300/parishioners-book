const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');
const Profile = require('../../models/Profile');
const Church = require('../../models/Church');

// @route GET api/Churches/
// @desc Get all Churches
// @access Private

router.get('/', auth, async (req, res) => {
  function lookup(from, localField, foreignField) {
    return {
      $lookup: {
        from: `${from}`,
        localField: `${localField}`,
        foreignField: `${foreignField}`,
        as: `${localField}`
      }
    };
  }

  function unwind(unwind) {
    return {
      $unwind: `${unwind}`
    };
  }

  let churches;
  function projectChurch() {
    return {
      $project: {
        _id: 1,
        name: 1,
        'district._id': 1,
        'district.name': 1,
        'district.association._id': 1,
        'district.association.name': 1,
        'createdBy._id': 1,
        'createdBy.name': 1,
        date: 1,
        'updatedBy._id': 1,
        'updatedBy.name': 1,
        updatedDate: 1
      }
    };
  }

  try {
    let profile = await Profile.findOne({ user: req.user.id });

    if (!profile) return res.status(400).json({ msg: 'No esta autorizado' });

    if (profile.createUnion) {
      churches = await Church.find()
        .populate('district', ['name'])
        .populate('createdBy', ['name'])
        .populate('updatedBy', ['name']);
      return res.json(churches);
    }

    if (profile.createAssociation) {
      if (!profile.union)
        return res.status(400).json({
          msg: 'Su perfil debe tener una unión para visualizar las iglesias'
        });
      churches = await Church.aggregate([
        lookup('districts', 'district', '_id'),
        unwind('$district'),
        lookup('associations', 'district.association', '_id'),
        unwind('$district.association'),
        { $match: { 'district.association.union': profile.union } },
        lookup('users', 'createdBy', '_id'),
        lookup('users', 'updatedBy', '_id'),
        projectChurch()
      ]);
      return res.json(churches);
    }
    if (profile.createDistrict) {
      if (!profile.association)
        return res.status(400).json({
          msg:
            'Su perfil debe tener una asociación para visualizar las iglesias'
        });
      churches = await Church.aggregate([
        lookup('districts', 'district', '_id'),
        unwind('$district'),
        { $match: { 'district.association': profile.association } },
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
            'district._id': 1,
            'district.name': 1,
            'district.association._id': 1,
            'district.association.name': 1,
            'createdBy._id': 1,
            'createdBy.name': 1,
            date: 1,
            'updatedBy._id': 1,
            'updatedBy.name': 1,
            updatedDate: 1
          }
        }
      ]);
      if (profile.createChurch) {
        if (!profile.district)
          return res.status(400).json({
            msg:
              'Su perfil debe tener una asociación para visualizar las iglesias'
          });
        const churches = await Church.find({})
          .populate('district', ['name'])
          .populate('createdBy', ['name'])
          .populate('updatedBy', ['name']);
        return res.json(churches);
      }
    }
    return res.status(400).json({ msg: 'No esta autorizado' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error del servidor');
  }
});

// @route POST api/churches/
// @desc create church
// @access Private

router.post(
  '/',
  [
    auth,
    [
      check('name', 'Debe ingresar el nombre de la Iglesia').not().isEmpty(),
      check(
        'district',
        'Debe ingresar el distrito al que pertenece la iglesia '
      )
        .not()
        .isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const churchFields = {};
    const { name, district } = req.body;
    if (name) churchFields.name = name;
    if (district) churchFields.district = district;
    try {
      let profile = await Profile.findOne({ user: req.user.id });
      if (profile.createUnion) {
        churchFields.createdBy = req.user.id;
        const church = new Church(churchFields);
        await church.save();
        return res.json(church);
      }
      return res.status(400).json({ msg: 'No está autorizado' });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Error en el servidor');
    }
  }
);

// @route GET api/churches/:church_id
// @desc Get a specific church by id
// @access Private
router.get('/:church_id', auth, async (req, res) => {
  try {
    let profile = await Profile.findOne({ user: req.user.id });
    if (!profile) return res.status(400).json({ msg: 'No esta autorizado' });
    if (profile.createUnion) {
      const church = await Church.findOne({
        _id: req.params.church_id
      })
        .populate('createdBy', ['name'])
        .populate('updatedBy', ['name'])
        .populate('district', ['name']);
      if (!church)
        return res.status(400).json({ msg: 'Esta Iglesia no existe' });
      res.json(church);
    }
    return res.status(400).json({ msg: 'No está autorizado' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error en el servidor');
  }
});

// @route PUT api/churches/:church_id
// @desc Update specific church by id
// @access Private

router.put(
  '/:church_id',
  [
    auth,
    [
      check('name', 'Debe ingresar el nombre de la Iglesia').not().isEmpty(),
      check(
        'district',
        'Debe ingresar el distrito al que pertenece la iglesia '
      )
        .not()
        .isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const churchFields = {};
    const { name, district } = req.body;
    if (name) churchFields.name = name;
    if (district) churchFields.district = district;
    try {
      let profile = await Profile.findOne({ user: req.user.id });
      if (profile.createUnion) {
        churchFields.updatedBy = req.user.id;
        churchFields.updatedDate = Date.now();
        const church = await Church.findOneAndUpdate(
          { _id: req.params.church_id },
          { $set: churchFields },
          { new: true }
        )
          .populate('createdBy', ['name'])
          .populate('updatedBy', ['name'])
          .populate('district', ['name']);

        return res.json(church);
      }
      return res.status(400).json({ msg: 'No está autorizado' });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Error en el servidor');
    }
  }
);

// @route DELETE api/churches/:church_id
// @desc Delete specific church by id
// @access Private

router.delete('/:church_id', auth, async (req, res) => {
  try {
    let profile = await Profile.findOne({ user: req.user.id });
    if (!profile) return res.status(400).json({ msg: 'No esta autorizado' });
    if (profile.createUnion) {
      await Church.findOneAndDelete({ _id: req.params.church_id }, function (
        err,
        docs
      ) {
        if (err) {
          console.log(err);
        } else {
          console.log('Delete Church: ', docs);
        }
      });
      return res.json({ msg: 'Iglesia eliminada' });
    }
    return res.status(400).json({ msg: 'No esta autorizado' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error en el servidor');
  }
});

module.exports = router;
