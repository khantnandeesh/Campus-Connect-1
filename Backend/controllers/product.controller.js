import Product from "../models/product.model.js";

export const getAllProducts = async (req, res) => {
    try {
        const products = await Product.find().populate("sellerId", "username email");
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: "Error getting products" });
    }
};

export const getProductById = async (req, res) => {
    try {
       const product = await Product.findById(req.params.productId).populate("sellerId", "username email");
       if(!product) {
           return res.status(404).json({ message: "Product not found" });
       }    
       res.json(product);    
    } catch (error) {
        res.status(500).json({ message: "Error getting product" });
    }
};

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
  

export const deleteProduct = async (req, res) => {
    try {
      const product = await Product.findById(req.params.id);
      if (!product) return res.status(404).json({ error: "Product not found" });
    
      if(product.sellerId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ error: "You are not authorized to delete this product" });
      }

      await product.deleteOne();
      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Server error" });
    }
};

