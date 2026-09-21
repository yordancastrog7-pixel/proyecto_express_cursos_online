// ============================================
// MODEL — Course (entidad principal)
// ============================================
import { Schema, model, InferSchemaType, Types } from 'mongoose';

const courseSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, unique: true, minlength: 2, maxlength: 120 },
    // Referencia a Category — populate() la convierte en el objeto completo al leer.
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    instructor: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    durationHours: { type: Number, required: true, min: 1 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export type CourseDocument = InferSchemaType<typeof courseSchema>;
export type CourseId = Types.ObjectId;

export const Course = model('Course', courseSchema);
