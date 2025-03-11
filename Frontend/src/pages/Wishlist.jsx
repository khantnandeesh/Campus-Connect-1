import { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

const Wishlist = () => {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWishlist = async () => {
      try {
        const response = await axios.get("http://localhost:3000/api/marketplace/wishlist", { withCredentials: true });
        setWishlist(response.data);
      } catch (error) {
        console.error("Error fetching wishlist:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWishlist();
  }, []);

  const removeFromWishlist = async (productId) => {
    try {
      await axios.delete(`http://localhost:3000/api/marketplace/wishlist/${productId}`, { withCredentials: true });
      setWishlist((prevWishlist) => prevWishlist.filter((item) => item._id !== productId));
      alert("Removed from wishlist!");
    } catch (error) {
      console.error("Error removing from wishlist:", error);
    }
  };

  return (
    <div className="p-6 bg-gray-900 min-h-screen text-white">
      <h2 className="text-3xl font-semibold mb-6 text-center">My Wishlist</h2>
      {loading ? (
        <p className="text-center">Loading wishlist...</p>
      ) : wishlist.length === 0 ? (
        <p className="text-center">No products in wishlist</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {wishlist.map((product) => (
            <div 
              key={product._id} 
              className="bg-gray-800 p-4 rounded-lg shadow-lg hover:shadow-xl transition-shadow border border-gray-700"
            >
              <Link to={`/marketplace/${product._id}`}>
                <img 
                  src={product.images[0]} 
                  alt={product.title} 
                  className="w-full h-48 object-cover rounded-lg" 
                />
                <h3 className="text-xl font-medium mt-3">{product.title}</h3>
                <p className="text-green-400 text-lg font-semibold">₹{product.price}</p>
              </Link>
              
              <button 
                onClick={() => removeFromWishlist(product._id)} 
                className="mt-3 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg w-full"
              >
                Remove from Wishlist ❌
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Wishlist;
