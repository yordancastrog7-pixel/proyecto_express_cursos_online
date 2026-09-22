// ============================================
// MODEL — Course (recurso protegido)
// ============================================
import { Schema, model, InferSchemaType } from 'mongoose';

const courseSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, unique: true, minlength: 2, maxlength: 120 },
    category: { type: String, required: true, trim: true },
    instructor: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    durationHours: { type: Number, required: true, min: 1 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export type CourseDocument = InferSchemaType<typeof courseSchema>;

export const Course = model('Course', courseSchema);
