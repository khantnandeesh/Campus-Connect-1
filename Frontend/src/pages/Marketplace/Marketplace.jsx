import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { Toaster } from "react-hot-toast";
import { 
  MessageCircle, 
  Heart, 
  Plus, 
  Package, 
  ShoppingCart, 
  Loader2 
} from "lucide-react";

const Marketplace = () => {
  const user = useSelector((state) => state.auth.user);
  const userId = user?._id;
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("");
  const [categories, setCategories] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get(
          "http://localhost:3000/api/marketplace/products"
        );
        setProducts(response.data);
        const uniqueCategories = [
          ...new Set(response.data.map((product) => product.category)),
        ];
        setCategories(uniqueCategories);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Fetch total unread messages from chat inbox
  useEffect(() => {
    if (!userId) return;
    const fetchUnreadCount = async () => {
      try {
        const response = await axios.get(
          `http://localhost:3000/api/chatMarket/inbox?userId=${userId}`,
          { withCredentials: true }
        );
        const totalUnread = response.data.reduce(
          (acc, chat) => acc + (chat.unreadCount || 0),
          0
        );
        setUnreadCount(totalUnread);
      } catch (error) {
        console.error("Error fetching unread messages:", error);
      }
    };

    fetchUnreadCount();
  }, [userId]);

  const filteredProducts = products
    .filter((product) =>
      product.title.toLowerCase().includes(search.toLowerCase())
    )
    .filter((product) => (category ? product.category === category : true))
    .sort((a, b) => {
      if (sort === "low-high") return a.price - b.price;
      if (sort === "high-low") return b.price - a.price;
      if (sort === "newest")
        return new Date(b.createdAt) - new Date(a.createdAt);
      return 0;
    });

  return (
    <div className="p-6 bg-gradient-to-br from-gray-900 to-black min-h-screen text-white">
      <Toaster position="top-right" reverseOrder={false} />
      
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-600 drop-shadow-lg">
          Marketplace
        </h2>
        <div className="flex space-x-4 flex-wrap justify-center">
          <Link
            to="/chat/inbox"
            className="relative bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-gray-500/50 m-1 flex items-center gap-2"
          >
            <MessageCircle className="w-5 h-5" />
            Messages
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold text-white bg-red-600 rounded-full">
                {unreadCount}
              </span>
            )}
          </Link>
          <Link
            to="/marketplace/wishlist"
            className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-gray-500/50 m-1 flex items-center gap-2"
          >
            <Heart className="w-5 h-5" />
            Wishlist
          </Link>
          <Link
            to="/marketplace/add"
            className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-gray-500/50 m-1 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Product
          </Link>
          <Link
            to="/marketplace/listings"
            className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-gray-500/50 m-1 flex items-center gap-2"
          >
            <Package className="w-5 h-5" />
            My Listings
          </Link>
          <Link
            to="/marketplace/orders"
            className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-gray-500/50 m-1 flex items-center gap-2"
          >
            <ShoppingCart className="w-5 h-5" />
            My Orders
          </Link>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <input
          type="text"
          placeholder="Search products..."
          className="p-3 w-full sm:w-1/3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 hover:border-blue-500"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="p-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
        <select
          className="p-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="">Sort By</option>
          <option value="low-high">Price: Low to High</option>
          <option value="high-low">Price: High to Low</option>
          <option value="newest">Newest Listings</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="animate-spin h-16 w-16 text-blue-500" />
        </div>
      ) : filteredProducts.length === 0 ? (
        <p className="text-center text-gray-400 text-xl">No products available</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <div
              key={product._id}
              className="bg-gray-800 p-4 rounded-lg shadow-xl border border-gray-700 relative hover:scale-105 transition-all duration-300 hover:shadow-2xl hover:shadow-gray-500/30"
            >
              <Link to={`/marketplace/${product._id}`} className="block">
                <img
                  src={product.images[0]}
                  alt={product.title}
                  className="w-full h-48 object-cover rounded-lg border-2 border-transparent hover:border-blue-500 transition-all duration-300"
                />
                <h3 className="text-xl font-medium mt-3 text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
                  {product.title}
                </h3>
                <p className="text-green-400 text-lg font-semibold">
                  ₹{product.price}
                </p>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm text-gray-400">{product.category}</span>
                  {product.sold && (
                    <span className="text-red-500 text-sm font-bold">Sold</span>
                  )}
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Marketplace;
