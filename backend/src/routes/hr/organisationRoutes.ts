
import { Router } from "express";

import {
    createOrganisationController,
    getOrganisationController,
    getAllOrganisationsController,
    updateOrganisationController,
    assignUserToOrganisationController,
} from "../../controllers/hr/organisationController";

import { validateTenantCreation } from "../../validators/common.validator";
import {
    authenticateToken,
    authorizeRoles,
} from "../../middleware/authMiddleware";

const router = Router();

router.use(authenticateToken);
router.use(authorizeRoles("admin"));

router.post(
    "/",
    validateTenantCreation,
    createOrganisationController
);

router.get("/", getAllOrganisationsController);

router.patch(
    "/assign-user",
    assignUserToOrganisationController
);

router.get("/:tenantId", getOrganisationController);

router.patch("/:tenantId", updateOrganisationController);

export default router;
