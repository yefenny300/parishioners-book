const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UnionSchema = new Schema({
  name: {
    type: String,
    required: ['true', 'Ingrese el nombre']
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

module.exports = Union = mongoose.model('union', UnionSchema);
