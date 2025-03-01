const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const journeySchema = new Schema(
  {
    customer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    route: {
      startLocation: {
        latitude: Number,
        longitude: Number,
      },
      path: [String],
      segments: [
        {
          from: String,
          to: String,
          mode: {
            type: String,
            enum: ["land", "air", "sea"],
          },
          fromCoords: {
            latitude: Number,
            longitude: Number,
          },
          toCoords: {
            latitude: Number,
            longitude: Number,
          },
          cost: Number,
          time: Number,
        },
      ],
      totalCost: Number,
      totalTime: Number,
    },
    package: {
      type: {
        type: String,
        required: true,
      },
      weight: {
        type: Number,
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
      },
      description: {
        type: String,
        default: "",
      },
      maxWeight: {
        type: Number,
        default: 0,
      },
    },
    status: {
      type: String,
      enum: ["IN_PROGRESS", "COMPLETED", "CANCELLED"],
      default: "IN_PROGRESS",
    },
    startTime: Date,
    completionTime: Date,
  },
  {
    timestamps: true,
  }
);

const Journey = mongoose.model("Journey", journeySchema);
module.exports = Journey;
