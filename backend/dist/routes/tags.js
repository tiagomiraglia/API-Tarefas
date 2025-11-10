"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const TagController_1 = require("../controllers/TagController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const controller = new TagController_1.TagController();
// Listar tags (todos podem ver)
router.get('/', auth_1.authenticateJWT, (req, res) => controller.listTags(req, res));
// CRUD (apenas admin)
router.post('/', auth_1.authenticateJWT, auth_1.requireAdminOrSuperuser, (req, res) => controller.createTag(req, res));
router.put('/:id', auth_1.authenticateJWT, auth_1.requireAdminOrSuperuser, (req, res) => controller.updateTag(req, res));
router.delete('/:id', auth_1.authenticateJWT, auth_1.requireAdminOrSuperuser, (req, res) => controller.deleteTag(req, res));
exports.default = router;
//# sourceMappingURL=tags.js.map