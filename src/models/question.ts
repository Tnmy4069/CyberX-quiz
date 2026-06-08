import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IQuestion extends Document {
  quizId: mongoose.Types.ObjectId;
  type: 'mcq' | 'msq' | 'true_false' | 'short_text';
  question: string;
  options: string[]; // Options array (empty for short text)
  correctAnswer: string[]; // List of correct answer(s)
  marks: number;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const QuestionSchema = new Schema<IQuestion>(
  {
    quizId: { type: Schema.Types.ObjectId, ref: 'Quiz', required: true, index: true },
    type: { type: String, enum: ['mcq', 'msq', 'true_false', 'short_text'], required: true },
    question: { type: String, required: true },
    options: { type: [String], default: [] },
    correctAnswer: { type: [String], required: true }, // We'll store strings (e.g. choice texts)
    marks: { type: Number, required: true },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
    tags: { type: [String], default: [] },
  },
  { timestamps: true }
);

export const Question: Model<IQuestion> = mongoose.models.Question || mongoose.model<IQuestion>('Question', QuestionSchema);
