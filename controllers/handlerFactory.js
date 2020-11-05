const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

exports.getAll = (Model, populateOptions, selectOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.find({}, selectOptions);

    if (populateOptions) {
      populateOptions.forEach((option) => {
        query = query.populate(option);
      });
    }

    const docs = await query;

    res.status(200).json({
      status: 'success',
      totalResults: docs.length,
      data: docs,
    });
  });

exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const newDoc = await Model.create(req.body);

    res.status(201).json({
      status: 'success',
      data: newDoc,
    });
  });

exports.getOne = (Model, populateOptions, selectOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id, selectOptions);

    if (populateOptions) {
      populateOptions.forEach((option) => (query = query.populate(option)));
    }

    const doc = await query;

    if (!doc) {
      return next(
        new AppError('There is no document found with that ID.', 404)
      );
    }

    res.status(200).json({
      status: 'success',
      data: doc,
    });
  });

exports.updateOne = (Model, notAllowedFields, populateOptions, selectOptions) =>
  catchAsync(async (req, res, next) => {
    const filteredBody = JSON.parse(JSON.stringify(req.body));

    if (notAllowedFields) {
      notAllowedFields.forEach((field) => delete filteredBody[field]);
    }

    if (Object.keys(filteredBody).length === 0) {
      return next(
        new AppError('You are not allowed to update these fields!', 400)
      );
    }

    let query = await Model.findByIdAndUpdate(req.params.id, filteredBody, {
      new: true, // This is to return the updated doc
      runValidators: true, // Because validators set in the schema are run only when we create/save (not update) the doc. So, we must set runValidators to true when we update the doc.
      select: selectOptions,
    });

    if (populateOptions) {
      populateOptions.forEach((option) => (query = query.populate(option)));
    }

    const newDoc = await query;

    if (!newDoc) {
      return next(
        new AppError('There is no document found with that ID.', 404)
      );
    }

    res.status(200).json({
      status: 'success',
      data: newDoc,
    });
  });
