import Product from "../models/product.model.js";
import Razorpay from "razorpay";
import crypto from "crypto";

// Initialize Razorpay (Test Mode)
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID, 
  key_secret: process.env.RAZORPAY_KEY_SECRET, 
});

export const buyNow = async (req, res) => {
  try {
    const { productId } = req.params;
    const { buyerId } = req.body; 

    // Fetch the product from database
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    if (product.sold) {
      return res.status(400).json({ message: "Product already sold" });
    }

    // Validate product price
    if (!product.price || isNaN(product.price)) {
      return res.status(400).json({ message: "Invalid product price" });
    }

    const options = {
      amount: product.price * 100,
      currency: "INR",
      receipt: `order_rcptid_${productId}`,
    };

    const order = await razorpay.orders.create(options);
    if (!order) {
      return res.status(500).json({ message: "Failed to create order" });
    }

    // Send order details to frontend
    res.status(200).json({
      orderId: order.id,
      productId: product._id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("Error in buyNow:", error);
    res.status(500).json({ message: "Payment initiation failed", error: error.message });
  }
};

// Verify Payment & Mark Product as Sold
export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, productId, buyerId } = req.body;
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ message: "Payment verification failed" });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    product.sold = true;
    product.buyerId = buyerId;
    await product.save();

    res.status(200).json({ message: "Payment verified, product marked as sold" });
  } catch (error) {
    console.error("Error in verifyPayment:", error);
    res.status(500).json({ message: "Payment verification failed", error: error.message });
  }
};


export const getUserOrders = async (req, res) => {
    try {
      const userId = req.user._id;
      // Find all products that are sold and where the buyerId matches the logged-in user
      const orders = await Product.find({ sold: true, buyerId: userId })
        .populate("sellerId", "username email")
        .sort({ createdAt: -1 });
      res.status(200).json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Error fetching orders" });
    }
  };
  


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
