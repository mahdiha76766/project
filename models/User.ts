import bcrypt from 'bcryptjs';
import { Schema, model, models } from 'mongoose';
import { USER_ROLES } from '@/constants/roles';

const UserSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    mobile: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, minlength: 8, select: false },
    role: { type: String, enum: USER_ROLES, default: 'CUSTOMER' },
    isBlocked: { type: Boolean, default: false }
  },
  { timestamps: true }
);

UserSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

export const User = models.User || model('User', UserSchema);
