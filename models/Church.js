const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const churchSchema = new Schema({
  name: {
    type: String,
    required: ['true', 'Ingrese el nombre de la Asociación']
  },
  district: {
    type: Schema.Types.ObjectId,
    ref: 'district'
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

module.exports = Church = mongoose.model('church', churchSchema);
