import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAppSettings extends Document {
  key: 'app';
  appName: string;
  logoData?: Buffer;
  logoContentType?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AppSettingsSchema = new Schema<IAppSettings>(
  {
    key: { type: String, required: true, unique: true, default: 'app' },
    appName: { type: String, required: true, default: 'CyberX Assessments' },
    logoData: { type: Buffer },
    logoContentType: { type: String },
  },
  { timestamps: true }
);

export const AppSettings: Model<IAppSettings> =
  mongoose.models.AppSettings || mongoose.model<IAppSettings>('AppSettings', AppSettingsSchema);
