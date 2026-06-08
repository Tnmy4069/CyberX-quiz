import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IParticipant extends Document {
  name: string;
  rollNumber: string;
  email: string;
  mobile: string;
  class: string;
  createdAt: Date;
  updatedAt: Date;
}

const ParticipantSchema = new Schema<IParticipant>(
  {
    name: { type: String, required: true },
    rollNumber: { type: String, required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    mobile: { type: String, required: true },
    class: { type: String, required: true }, // Class or Department
  },
  { timestamps: true }
);

export const Participant: Model<IParticipant> = mongoose.models.Participant || mongoose.model<IParticipant>('Participant', ParticipantSchema);
