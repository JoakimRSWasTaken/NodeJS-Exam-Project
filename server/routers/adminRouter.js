import { Router } from "express";
import db from "../database/connection.js";
import { isLoggedIn, isAllowedRole } from "../utils/authMiddleware.js"; // Tilpas stien til dine middlewares

const router = Router();

router.use(isLoggedIn, isAllowedRole(['admin']));

router.get('/api/admin/insurance-claims', async (req, res) => {

    const claims = await db.all(`
            SELECT 
                insurance_claims.*, 
                tasks.title AS task_title,
                users.username AS customer_name,
                users.email AS customer_email
            FROM insurance_claims
            JOIN tasks ON insurance_claims.task_id = tasks.id
            JOIN users ON insurance_claims.customer_id = users.id
            ORDER BY 
                CASE WHEN insurance_claims.status = 'pending' THEN 0 ELSE 1 END, -- 'pending' vises øverst
                insurance_claims.creation_date DESC
        `);

    return res.send({ data: claims });

});

router.patch('/api/admin/insurance-claims/:id', async (req, res) => {

    const insuranceClaimId = req.params.id;
    const { status, decidedCompensation } = req.body;

    if (!status || (status !== 'approved' && status !== 'denied')) {
        return res.status(400).send({ errorMessage: 'Invalid status. Must be either approved or denied.' });
    }

    if (status === 'approved' && (!decidedCompensation || decidedCompensation === 0)) {
        return res.status(400).send({ errorMessage: 'You must provide a decided compensation amount to mark claim as approved.' });
    }

    const insuranceClaim = await db.get('SELECT * FROM insurance_claims WHERE id = ?', [insuranceClaimId]);
    if (!insuranceClaim) {
        return res.status(404).send({ errorMessage: `Insurance claim with id ${insuranceClaimId} not found.` });
    }

    if (insuranceClaim.status !== 'pending') {
        return res.status(400).send({ errorMessage: `This claim has already been handled and is ${insuranceClaim.status}.` });
    }

    const now = new Date().toISOString();

    const result = await db.all(`
            UPDATE insurance_claims 
            SET status = ?, handled_date = ?, decided_compensation = ?
            WHERE id = ?
            RETURNING *
        `, [status, now, decidedCompensation, insuranceClaimId]);

    return res.send({ data: result[0] });

});

export default router;