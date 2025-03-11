import express from 'express';
import protectRoute from '../middlewares/protectRoute.js';
import { createProduct, deleteProduct, getAllProducts, getMyListings, getProductById, markProductAsSold, updateProduct } from '../controllers/product.controller.js';
import upload from '../middlewares/uploadMiddleware.js';
import { addToWishlist, getWishlist, removeFromWishlist } from '../controllers/wishlist.controller.js';

const router = express.Router();

router.get('/products', protectRoute, getAllProducts);
router.get('/products/:id', protectRoute, getProductById);
router.post('/products/', protectRoute, upload.array("images",5), createProduct);
router.put("/products/:id", protectRoute, upload.array("images", 5), updateProduct);
router.delete('/products/:id', protectRoute, deleteProduct);
router.get("/wishlist/", protectRoute, getWishlist);
router.post("/wishlist/:productId", protectRoute, addToWishlist);
router.delete("/wishlist/:productId", protectRoute, removeFromWishlist);
router.get("/my-listings", protectRoute, getMyListings);
router.put("/products/:id/mark-sold", protectRoute, markProductAsSold);



export default router;