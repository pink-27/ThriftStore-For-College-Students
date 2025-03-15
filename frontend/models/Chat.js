"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mongoose_1 = require("mongoose");
var ChatSchema = new mongoose_1.Schema({
    conversationId: { type: String, required: true }, // Fixed spelling
    text: { type: String, required: true },
    timestamp: { type: Number, required: true }, // Unix timestamp
}, { timestamps: true } // Automatically adds createdAt & updatedAt
);
exports.default = mongoose_1.default.models.Chat ||
    mongoose_1.default.model("Chat", ChatSchema);
