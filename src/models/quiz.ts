import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IQuiz extends Document {
  title: string;
  description: string;
  accessCode: string;
  duration: number; // in minutes
  startDate: Date;
  endDate: Date;
  totalMarks: number;
  negativeMarking: boolean;
  active: boolean;
  createdBy: mongoose.Types.ObjectId | string | null; // ObjectId of Admin, or 'super-admin'
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showLeaderboard: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const QuizSchema = new Schema<IQuiz>(
  {
    title: { type: String, required: true },
    description: { type: String, default: '' },
    accessCode: { type: String, required: true, unique: true, uppercase: true, trim: true },
    duration: { type: Number, required: true }, // in minutes
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    totalMarks: { type: Number, required: true },
    negativeMarking: { type: Boolean, default: false },
    active: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.Mixed, default: null }, // Can be Schema.Types.ObjectId or String
    shuffleQuestions: { type: Boolean, default: false },
    shuffleOptions: { type: Boolean, default: false },
    showLeaderboard: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Quiz: Model<IQuiz> = mongoose.models.Quiz || mongoose.model<IQuiz>('Quiz', QuizSchema);
