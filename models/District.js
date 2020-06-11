const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const DistrictSchema = new Schema({
  name: {
    type: String,
    required: ['true', 'Ingrese el nombre de la Asociación']
  },
  association: {
    type: Schema.Types.ObjectId,
    ref: 'association'
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

module.exports = District = mongoose.model('district', DistrictSchema);
