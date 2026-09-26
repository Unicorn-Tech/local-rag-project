"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadInsuranceDocument = loadInsuranceDocument;
const promises_1 = require("node:fs/promises");
const node_path_1 = require("node:path");
async function loadInsuranceDocument(filePath) {
    const absolutePath = (0, node_path_1.resolve)(filePath);
    const content = await (0, promises_1.readFile)(absolutePath, "utf-8");
    return content.trim();
}
