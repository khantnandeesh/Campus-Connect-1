import Product from "../models/product.model.js";

// Get all products
export const getAllProducts = async (req, res) => {
    try {
        const products = await Product.find({ sold: false }).populate("sellerId", "username email");
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: "Error getting products" });
    }
};

// Get product by ID
export const getProductById = async (req, res) => {
    try {
       const product = await Product.findById(req.params.id).populate("sellerId", "username email");
       if(!product) {
           return res.status(404).json({ message: "Product not found" });
       }
       res.json(product);    
    } catch (error) {
        res.status(500).json({ message: "Error getting product" });
    }
};

// Fetch seller's listings
export const getMyListings = async (req, res) => {
    try {
        const sellerId = req.user._id;
        const products = await Product.find({ sellerId }).sort({ createdAt: -1 });
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ message: "Error fetching listings" });
    }
};

// Create a product
export const createProduct = async (req, res) => {
    try {
        const { title, description, price, category } = req.body;
        if (!title || !price || !category) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        // Upload images to Cloudinary
        const imageUrls = req.files.map((file) => file.path);

        const newProduct = new Product({
            title,
            description,
            price,
            category,
            images: imageUrls,
            sellerId: req.user._id, 
        });

        await newProduct.save();
        res.status(201).json(newProduct);
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
};

// Delete a product
export const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ error: "Product not found" });

        if (product.sellerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: "Unauthorized to delete this product" });
        }

        await product.deleteOne();
        res.json({ message: "Product deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
};

// Update a product
export const updateProduct = async (req, res) => {
    try {
        const { title, description, price, category } = req.body;
        const productId = req.params.id;

        let product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        if (product.sellerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Unauthorized to update this product" });
        }

        let imageUrls = product.images;
        if (req.files && req.files.length > 0) {
            imageUrls = req.files.map((file) => file.path);
        }

        product = await Product.findByIdAndUpdate(
            productId,
            { title, description, price, category, images: imageUrls },
            { new: true }
        );

        res.json(product);
    } catch (error) {
        res.status(500).json({ message: "Error updating product" });
    }
};

// Mark product as sold
export const markProductAsSold = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findById(id);

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        if (product.sellerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        product.sold = true;
        await product.save();

        res.status(200).json({ message: "Product marked as sold", product });
    } catch (error) {
        res.status(500).json({ message: "Failed to mark product as sold" });
    }
};
