const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AssociationSchema = new Schema({
  name: {
    type: String,
    required: ['true', 'Ingrese el nombre de la Asociación']
  },
  union: {
    type: Schema.Types.ObjectId,
    ref: 'union'
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'user'
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'user'
  },
  date: {
    type: Date,
    default: Date.now
  },
  updatedDate: {
    type: Date
  }
});

module.exports = Association = mongoose.model('association', AssociationSchema);
