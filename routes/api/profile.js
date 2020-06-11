const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');
const Profile = require('../../models/Profile');
const User = require('../../models/User');

// @route GET api/profile/me
// @desc Get current user profile
// @access Private

router.get('/me', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.user.id
    }).populate('user', ['name', 'avatar', 'email']);

    if (!profile) {
      return res
        .status(400)
        .json({ msg: 'No hay un perfil para este usuario' });
    }
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error de servidor');
  }
});

// @route POST api/profile/
// @desc Create or Update profile
// @access Private

router.post(
  '/',
  [
    auth,
    [
      check('status', 'Ingrese su cargo').not().isEmpty(),
      check('church', 'Seleccione su iglesia')
        .if(check('status').isIn(['Secretaria']))
        .not()
        .isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      status,
      createUnion,
      createAssociation,
      createDistrict,
      createChurch,
      union,
      association,
      district,
      church
    } = req.body;

    //Build profile Object
    const profileFields = {};
    profileFields.user = req.user.id;
    if (status) profileFields.status = status;
    if (createUnion) profileFields.createUnion = createUnion;
    if (createAssociation) profileFields.createAssociation = createAssociation;
    if (createDistrict) profileFields.createDistrict = createDistrict;
    if (createChurch) profileFields.createChurch = createChurch;
    if (union) profileFields.union = union;
    if (association) profileFields.association = association;
    if (district) profileFields.district = district;
    if (church) profileFields.church = church;

    try {
      let profile = await Profile.findOne({ user: req.user.id });

      if (profile) {
        // Update
        profileFields.updatedBy = req.user.id;
        profile = await Profile.findOneAndUpdate(
          { user: req.user.id },
          { $set: profileFields },
          { new: true }
        )
          .populate('union', ['name'])
          .populate('association', ['name'])
          .populate('district', ['name'])
          .populate('church', ['name'])
          .populate('updatedBy', ['name'])
          .populate('createdBy', ['name']);

        return res.json(profile);
      }

      //Create
      profileFields.createdBy = req.user.id;
      profile = new Profile(profileFields);
      await profile.save();
      return res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.status(505).send('Error del servidor');
    }
  }
);

// @route Get api/profile/
// @desc Show all profiles
// @access Private
router.get('/', auth, async (req, res) => {
  // Show profiles according to status
  let profile = await Profile.findOne({ user: req.user.id });
  if (!profile) return res.status(400).json({ msg: 'No autorizado' });
  try {
    if (profile.status === 'Admin') {
      const profiles = await Profile.find()
        .populate('user', ['name', 'avatar', 'email'])
        .populate('updatedBy', ['name']);
      return res.json(profiles);
    }
    if (profile.status === 'Pastor' && profile.activated) {
      const profiles = await Profile.find({
        status: 'Secretaria'
      }).populate('user', ['name', 'avatar']);
      return res.json(profiles);
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error del servidor');
  }
});

// @route Get api/profile/user/user_id
// @desc Find profile by Id
// @access Private
router.get('/user/:user_id', auth, async (req, res) => {
  let currentProfile = await Profile.findOne({ user: req.user.id });
  if (currentProfile.status === 'Secretaria')
    return res.status(400).json({ msg: 'Perfil no encontrado' });
  try {
    // Profile that I will display
    const profile = await Profile.findOne({
      user: req.params.user_id
    }).populate('user', ['name', 'avatar']);
    if (
      currentProfile.status === 'Admin' ||
      (currentProfile.status === 'Pastor' && profile.status === 'Secretaria')
    ) {
      return res.json(profile);
    } else {
      return res.status(400).json({ msg: 'Perfil no encontrado' });
    }
  } catch (err) {
    console.error(err.message);
    if (err.kind == 'ObjectId') {
      return res.status(400).json({ msg: 'Perfil no encontrado' });
    }
    res.status(500).send('Server Error');
  }
});

// @route Delete api/profile/
// @desc Delete profile & user
// @access Private
router.delete('/', auth, async (req, res) => {
  try {
    //Delete profile
    await Profile.findOneAndDelete({ user: req.user.id });
    // Remover User
    await User.findOneAndDelete({ _id: req.user.id });
    res.json({ msg: 'Usuario eliminado' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error ');
  }
});

module.exports = router;
