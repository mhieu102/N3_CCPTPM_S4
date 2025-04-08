const mongoose = require('mongoose');

const schoolYearSchema = new mongoose.Schema({
    school_year_code: { type: String, required: true, unique: true },
    school_year_name: { type: String, required: true },
}, {
    timestamps: true,
});

schoolYearSchema.virtual('terms', {
    ref: 'Term',
    localField: 'school_year_code',
    foreignField: 'school_year_code',
});

schoolYearSchema.virtual('grades', {
    ref: 'Grade',
    localField: 'school_year_code',
    foreignField: 'school_year_code',
});

const SchoolYear = mongoose.model('SchoolYear', schoolYearSchema);
module.exports = SchoolYear;