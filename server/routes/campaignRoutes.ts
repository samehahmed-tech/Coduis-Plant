import { Router } from 'express';
import * as campaignController from '../controllers/campaignController';

const router = Router();

router.get('/', campaignController.getCampaigns);
router.get('/stats', campaignController.getCampaignStats);
router.post('/', campaignController.createCampaign);
router.put('/:id', campaignController.updateCampaign);
router.delete('/:id', campaignController.deleteCampaign);

export default router;
