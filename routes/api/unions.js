const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');
const Union = require('../../models/Union');
const Profile = require('../../models/Profile');

// @route GET api/unions/
// @desc Get all Unions
// @access Private

router.get('/', auth, async (req, res) => {
  try {
    const unions = await Union.find()
      .populate('createdBy', ['name'])
      .populate('updatedBy', ['name']);
    if (unions) return res.json(unions);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send('Error en el servidor');
  }
});

// @route Get api/unions/:union_id
// @desc Get specific union
// access Private

router.get('/:union_id', auth, async (req, res) => {
  try {
    let profile = await Profile.findOne({ user: req.user.id });
    if (!profile || !profile.createUnion)
      return res.status(400).json({ msg: 'No esta autorizado' });
    const union = await Union.findOne({
      _id: req.params.union_id
    })
      .populate('createdBy', ['name'])
      .populate('updatedBy', ['name']);
    if (!union) return res.status(400).json({ msg: 'Union no existente' });
    return res.json(union);
  } catch (err) {}
});

// @route Post api/unions
// @desc Create union
// access Private

router.post(
  '/',
  [auth, [check('name', 'Ingrese el nombre de la union').not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name } = req.body;
    const unionFields = {};
    if (name) unionFields.name = name;
    unionFields.createdBy = req.user.id;
    try {
      let profile = await Profile.findOne({ user: req.user.id });
      if (profile && profile.createUnion) {
        const union = new Union(unionFields);
        await union.save();
        return res.json(union);
      }
      return res.status(400).json({ msg: 'Usted no esta autorizado' });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Error del servidor');
    }
  }
);

// @route Put api/union
// @desc Update union
// access Private

router.put(
  '/:union_id',
  [auth, [check('name', 'Ingrese el nombre de la union').not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name } = req.body;

    const unionFields = {};

    if (name) unionFields.name = name;
    unionFields.updatedBy = req.user.id;
    unionFields.updatedDate = Date.now();

    try {
      let profile = await Profile.findOne({ user: req.user.id });
      if (!profile || !profile.createUnion)
        return res.status(400).json({ msg: 'Usted no esta autorizado' });
      let union = await Union.findOne({ _id: req.params.union_id });
      if (union) {
        const union = await Union.findOneAndUpdate(
          {
            _id: req.params.union_id
          },
          { $set: unionFields },
          { new: true }
        );
        return res.json(union);
      }
      return res.status(400).json({ msg: 'Union no existe' });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Error del servidor');
    }
  }
);

// @route Delete api/unions/:union_id
// @desc Delete specific union
// access Private

router.delete('/:union_id', auth, async (req, res) => {
  try {
    let profile = await Profile.findOne({ user: req.user.id });
    if (!profile || !profile.createUnion)
      return res.status(400).json({ msg: 'No esta autorizado' });
    await Union.findOneAndDelete({ _id: req.params.union_id });
    return res.json({ msg: 'Union eliminada' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error del servidor');
  }
});

module.exports = router;
