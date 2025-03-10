import express from 'express';
import protectRoute from '../middlewares/protectRoute.js';
import { createProduct, deleteProduct, getAllProducts, getProductById } from '../controllers/product.controller.js';
import upload from '../middlewares/uploadMiddleware.js';

const router = express.Router();

router.get('/', protectRoute, getAllProducts);
router.get('/:id', protectRoute, getProductById);
router.post('/', protectRoute, upload.array("images",5), createProduct);
router.delete('/:id', protectRoute, deleteProduct);

export default router;