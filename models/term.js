const mongoose = require('mongoose');

const termSchema = new mongoose.Schema({
    term_code: { type: String, required: true, unique: true },
    term_name: { type: String, required: true },
    start_date: { type: Date, required: true },
    end_date: { type: Date, required: true },
    school_year_code: { type: String, ref: 'SchoolYear', required: true },
}, {
    timestamps: true,
});

termSchema.virtual('scores', {
    ref: 'Score',
    localField: 'term_code',
    foreignField: 'term_code',
});

termSchema.virtual('schoolYear', {
    ref: 'SchoolYear',
    localField: 'school_year_code',
    foreignField: 'school_year_code',
    justOne: true,
});

const Term = mongoose.model('Term', termSchema);
module.exports = Term;