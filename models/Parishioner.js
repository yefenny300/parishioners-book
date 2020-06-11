const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ParishionerSchema = new Schema({
  church: {
    type: String,
    required: ['true', 'Debe ingresar una iglesia']
  },
  name: {
    type: String,
    required: ['true', 'Debe ingresar el nombre']
  },
  address: {
    type: String
  },
  telephone: {
    type: String
  },
  cellphone: {
    type: String
  },
  whatsapp: {
    type: String
  },
  bloodType: {
    type: String
  },
  birthDate: {
    type: Date
  },
  sex: {
    type: String,
    enum: ['Masculino', 'Femenino']
  },
  baptized: { type: Boolean },
  baptizedDate: { type: Date },
  parishionerInChurch: { type: Boolean },
  reunionGroup: { type: Boolean },
  positions: {
    type: [String]
  },
  relationStatus: {
    type: String
  },
  familyMembers: {
    type: [String]
  },
  houseOwner: {
    type: Boolean
  },
  ocupation: {
    type: String
  },
  studies: {
    type: String
  }
});
