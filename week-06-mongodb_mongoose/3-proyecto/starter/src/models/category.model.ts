// ============================================
// MODEL — Category (entidad secundaria)
// ============================================
import { Schema, model, InferSchemaType } from 'mongoose';

const categorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true, unique: true, minlength: 2, maxlength: 40 },
    description: { type: String, trim: true, maxlength: 200 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

// Tipo inferido directamente del schema — no se duplica a mano en types.ts.
export type CategoryDocument = InferSchemaType<typeof categorySchema>;

export const Category = model('Category', categorySchema);
