import mongoose, { model, type Model, type Schema } from 'mongoose';

/** Safe model registration for Next.js hot-reload (models may be undefined in some bundles). */
export function registerModel<T>(name: string, schema: Schema<T>): Model<T> {
  return (mongoose.models[name] as Model<T> | undefined) || model<T>(name, schema);
}
