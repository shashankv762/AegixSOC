import { Router } from 'express';
import { phase1Service } from '../services/phase1_service.js';

const router = Router();

router.get('/threats', (req, res) => {
  res.json(phase1Service.getThreats());
});

router.get('/layers', (req, res) => {
  res.json(phase1Service.getLayers());
});

router.get('/memory', (req, res) => {
  res.json(phase1Service.getMemory());
});

export default router;
