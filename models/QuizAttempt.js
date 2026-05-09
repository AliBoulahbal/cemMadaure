const mongoose = require("mongoose");
const { Schema } = mongoose;

const quizAnswerSubmissionSchema = new Schema({
  quizId: { type: String, required: true },
  submittedAnswers: [{ type: String }],
  score: { type: Number, default: 0 },
}, { _id: false });

const quizAttemptSchema = new Schema(
  {
    lessonId: {
      type: Schema.Types.ObjectId,
      ref: "Lesson",
      required: true,
      index: true,
    },
    clientId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    score: { type: Number, default: 0 },
    submittedAnswers: [quizAnswerSubmissionSchema],
    _class: { type: String, default: "org.madaurecem.backoffice.models.QuizAttempt" }
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        ret.id = ret._id.toString();
      },
    },
  }
);

quizAttemptSchema.index({ lessonId: 1, clientId: 1 });

module.exports = mongoose.model("QuizAttempt", quizAttemptSchema);
