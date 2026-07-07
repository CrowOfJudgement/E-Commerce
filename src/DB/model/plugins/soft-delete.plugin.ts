import { Schema } from 'mongoose';

type QueryWithSoftDeleteOptions = {
  getFilter(): Record<string, unknown>;
  getOptions(): Record<string, unknown>;
  where(filter: Record<string, unknown>): void;
};

const activeDocumentFilter = { isDeleted: { $ne: true } };

function excludeSoftDeleted(this: QueryWithSoftDeleteOptions) {
  const filter = this.getFilter();
  const options = this.getOptions();

  if (options.includeDeleted === true || Object.prototype.hasOwnProperty.call(filter, 'isDeleted')) {
    return;
  }

  this.where(activeDocumentFilter);
}

export function applySoftDeleteQueryHooks(schema: Schema) {
  schema.pre('find', excludeSoftDeleted);
  schema.pre('findOne', excludeSoftDeleted);
  schema.pre('findOneAndUpdate', excludeSoftDeleted);
  schema.pre('updateOne', excludeSoftDeleted);
  schema.pre('updateMany', excludeSoftDeleted);
  schema.pre('countDocuments', excludeSoftDeleted);
}
