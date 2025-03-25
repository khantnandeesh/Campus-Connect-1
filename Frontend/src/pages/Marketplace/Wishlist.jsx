import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { Toaster, toast } from "react-hot-toast";

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
        toast.error("Failed to fetch wishlist");
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
      toast.success("Removed from wishlist!");
    } catch (error) {
      console.error("Error removing from wishlist:", error);
      toast.error("Failed to remove from wishlist");
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-gradient-to-br from-gray-900 to-black min-h-screen flex justify-center items-center text-white">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gradient-to-br from-gray-900 to-black min-h-screen text-white">
      <Toaster position="top-right" reverseOrder={false} />
      <h2 className="text-3xl font-semibold mb-6 text-center">My Wishlist</h2>
      {wishlist.length === 0 ? (
        <p className="text-center text-gray-400">No products in wishlist</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {wishlist.map((product) => (
            <div 
              key={product._id} 
              className="bg-gray-800 p-4 rounded-lg shadow-xl border border-gray-700 hover:scale-105 transition-all duration-300 hover:shadow-2xl"
            >
              <Link to={`/marketplace/${product._id}`}>
                <img 
                  src={product.images[0]} 
                  alt={product.title} 
                  className="w-full h-48 object-cover rounded-lg border-2 border-transparent hover:border-blue-500 transition-all duration-300" 
                />
                <h3 className="text-xl font-medium mt-3">{product.title}</h3>
                <p className="text-green-400 text-lg font-semibold">₹{product.price}</p>
              </Link>
              <button 
                onClick={() => removeFromWishlist(product._id)} 
                className="mt-3 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg w-full transition-all duration-300 hover:shadow-lg"
              >
                Remove from Wishlist
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Wishlist;
