import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISubmission extends Document {
  submissionId: string;
  quizId: mongoose.Types.ObjectId;
  participantId: mongoose.Types.ObjectId;
  score: number;
  answers: Record<string, string[]>; // questionId -> list of selected options or short text input
  tabSwitchCount: number;
  fullscreenExitCount: number;
  submittedAt: Date;
  status: 'in-progress' | 'submitted' | 'time-up';
  createdAt: Date;
  updatedAt: Date;
}

const SubmissionSchema = new Schema<ISubmission>(
  {
    submissionId: { type: String, required: true, unique: true },
    quizId: { type: Schema.Types.ObjectId, ref: 'Quiz', required: true, index: true },
    participantId: { type: Schema.Types.ObjectId, ref: 'Participant', required: true, index: true },
    score: { type: Number, default: 0 },
    answers: { type: Schema.Types.Mixed, default: {} }, // Stores questionId: selected answers
    tabSwitchCount: { type: Number, default: 0 },
    fullscreenExitCount: { type: Number, default: 0 },
    submittedAt: { type: Date, required: true },
    status: { type: String, enum: ['in-progress', 'submitted', 'time-up'], default: 'submitted' },
  },
  { timestamps: true }
);

export const Submission: Model<ISubmission> = mongoose.models.Submission || mongoose.model<ISubmission>('Submission', SubmissionSchema);
