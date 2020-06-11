const mongoose = require('mongoose');

const ProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user'
  },
  status: {
    type: String,
    enum: ['Admin', 'Pastor', 'Secretaria'],
    required: [true, 'Ingrese Cargo']
  },
  createUnion: {
    type: Boolean,
    default: false
  },
  createAssociation: {
    type: Boolean,
    default: false
  },
  createDistrict: {
    type: Boolean,
    default: false
  },
  createChurch: {
    type: Boolean,
    default: false
  },
  createParishioner: {
    type: Boolean,
    default: false
  },
  union: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'union'
  },
  association: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'association'
  },
  district: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'district'
  },
  church: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'church',
    required: [
      function () {
        return this.createParishioner;
      },
      'Debe ingresar una iglesia'
    ]
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user'
  },
  date: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user'
  },
  updatedDate: {
    type: Date
  }
});

module.exports = Profile = mongoose.model('profile', ProfileSchema);
