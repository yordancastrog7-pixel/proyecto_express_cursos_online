// ============================================
// SEED ADMIN — crea (o promueve) al primer administrador
// ============================================
// El registro público nunca crea admins. Este script es la única vía y toma los
// datos del .env (ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD): nada queda en el código.
// Se puede correr varias veces: si el email ya existe, solo se le asigna el rol admin.
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import { connectDB } from './config/db';
import { SALT_ROUNDS } from './config/auth.config';
import { ROLES } from './config/roles';
import { registerSchema } from './schemas/auth.schema';
import { User } from './models/user.model';

async function main(): Promise<void> {
  const password = process.env['ADMIN_PASSWORD'] ?? '';
  if (password.startsWith('cambia-esto')) {
    throw new Error('ADMIN_PASSWORD todavía tiene el valor de ejemplo: pon una contraseña real en tu .env.');
  }

  // Mismas reglas que el registro: email válido, contraseña de 8+ con letra y número.
  const admin = registerSchema.parse({
    name: process.env['ADMIN_NAME'],
    email: process.env['ADMIN_EMAIL'],
    password,
  });

  await connectDB();

  await User.findOneAndUpdate(
    { email: admin.email },
    {
      $set: { role: ROLES.ADMIN },
      $setOnInsert: { name: admin.name, password: await bcrypt.hash(admin.password, SALT_ROUNDS) },
    },
    { upsert: true },
  );

  console.log(`Admin listo: ${admin.email}`);
}

main()
  .catch((err: Error) => {
    console.error(err.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
