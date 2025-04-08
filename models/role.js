const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
    role_code: { type: String, required: true, unique: true },
    role_name: { type: String, required: true },
}, {
    timestamps: true,
});

roleSchema.statics.findByCode = async function (role_code) {
    return this.findOne({ role_code });
};

const Role = mongoose.model('Role', roleSchema);
module.exports = Role;