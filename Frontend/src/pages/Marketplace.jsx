import { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";

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
        const response = await axios.get("http://localhost:3000/api/marketplace/products");
        setProducts(response.data);
        const uniqueCategories = [...new Set(response.data.map((product) => product.category))];
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
        const response = await axios.get(`http://localhost:3000/api/chat/inbox?userId=${userId}`, {
          withCredentials: true,
        });
        // Sum up unread counts from each chat
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
    .filter((product) => product.title.toLowerCase().includes(search.toLowerCase()))
    .filter((product) => (category ? product.category === category : true))
    .sort((a, b) => {
      if (sort === "low-high") return a.price - b.price;
      if (sort === "high-low") return b.price - a.price;
      if (sort === "newest") return new Date(b.createdAt) - new Date(a.createdAt);
      return 0;
    });

  return (
    <div className="p-6 bg-gray-900 min-h-screen text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-3xl font-semibold">Marketplace</h2>
        <div className="flex space-x-4">
          <Link
            to="/chat/inbox"
            className="relative bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
          >
            📩 Messages
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold text-white bg-red-600 rounded-full">
                {unreadCount}
              </span>
            )}
          </Link>
          <Link
            to="/marketplace/wishlist"
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
          >
            ❤️ Wishlist
          </Link>
          <Link
            to="/marketplace/add"
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            ➕ Add Product
          </Link>
          <Link
            to="/marketplace/listings"
            className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg"
          >
            📦 My Listings
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <input
          type="text"
          placeholder="Search products..."
          className="p-3 w-full sm:w-1/3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="p-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          className="p-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="">Sort By</option>
          <option value="low-high">Price: Low to High</option>
          <option value="high-low">Price: High to Low</option>
          <option value="newest">Newest Listings</option>
        </select>
      </div>

      {/* Products List */}
      {loading ? (
        <p className="text-center text-gray-400">Loading products...</p>
      ) : filteredProducts.length === 0 ? (
        <p className="text-center text-gray-400">No products available</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <div
              key={product._id}
              className="bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-700 relative hover:scale-105 transition-transform"
            >
              <Link to={`/marketplace/${product._id}`} className="block">
                <img src={product.images[0]} alt={product.title} className="w-full h-48 object-cover rounded-lg" />
                <h3 className="text-xl font-medium mt-3">{product.title}</h3>
                <p className="text-green-400 text-lg font-semibold">₹{product.price}</p>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Marketplace;
