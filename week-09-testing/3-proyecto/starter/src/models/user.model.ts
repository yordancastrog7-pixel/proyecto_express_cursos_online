// ============================================
// MODEL — User
// ============================================
import { Schema, model, InferSchemaType } from 'mongoose';
import { ROLES, ROLE_VALUES } from '../config/roles';

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 60 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // Hash de bcrypt, NUNCA la contraseña. `select: false` hace que no salga en
    // ninguna consulta (ni por accidente en una respuesta) salvo que se pida
    // explícitamente con .select('+password').
    password: { type: String, required: true, select: false },
    // Todo usuario nuevo es 'user'. El registro público NUNCA acepta un rol desde
    // el cliente: un admin solo se crea con `pnpm seed:admin`.
    role: { type: String, enum: ROLE_VALUES, default: ROLES.USER },
    // SHA-256 del refresh token vigente. Una sola sesión de refresh por usuario.
    refreshToken: { type: String, select: false },
  },
  { timestamps: true },
);

export type UserDocument = InferSchemaType<typeof userSchema>;

export const User = model('User', userSchema);
