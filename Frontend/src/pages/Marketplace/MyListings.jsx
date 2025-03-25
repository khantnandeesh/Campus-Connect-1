import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { Toaster, toast } from "react-hot-toast";

const MyListings = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const response = await axios.get("http://localhost:3000/api/marketplace/my-listings", {
          withCredentials: true,
        });
        setListings(response.data);
        // Removed toast for successful listings load
      } catch (err) {
        console.error("Error fetching listings:", err);
        setError("Failed to load listings.");
        toast.error("Failed to load listings");
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, []);

  const deleteProduct = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;

    try {
      await axios.delete(`http://localhost:3000/api/marketplace/products/${id}`, {
        withCredentials: true,
      });
      setListings((prev) => prev.filter((product) => product._id !== id));
      toast.success("Product deleted successfully!");
    } catch (err) {
      console.error("Error deleting product:", err);
      toast.error("Failed to delete product");
    }
  };

  const markAsSold = async (id) => {
    try {
      await axios.put(
        `http://localhost:3000/api/marketplace/products/${id}/mark-sold`,
        {},
        { withCredentials: true }
      );
      setListings((prev) =>
        prev.map((product) =>
          product._id === id ? { ...product, sold: true } : product
        )
      );
      toast.success("Product marked as sold!");
    } catch (err) {
      console.error("Error marking product as sold:", err);
      toast.error("Failed to update product status");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex justify-center items-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gradient-to-br from-gray-900 to-black min-h-screen flex flex-col items-center">
      <Toaster position="top-right" reverseOrder={false} />
      
      <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-600 drop-shadow-lg mb-6">
        My Listings
      </h2>

      {listings.length === 0 ? (
        <div className="flex flex-col justify-center items-center text-gray-400 space-y-4">
          <p className="text-xl">You haven't listed any products yet.</p>
          <Link 
            to="/marketplace/add" 
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-all duration-300 hover:shadow-lg"
          >
            Add New Product
          </Link>
        </div>
      ) : (
        <div className="w-full max-w-4xl space-y-4">
          {listings.map((product) => (
            <div
              key={product._id}
              className="bg-gray-800 p-4 rounded-lg shadow-xl border border-gray-700 flex items-center hover:scale-[1.02] transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/30 relative"
            >
              <img
                src={product.images[0]}
                alt={product.title}
                className="w-24 h-24 object-cover rounded-md mr-4 cursor-pointer border-2 border-transparent hover:border-blue-500 transition-all duration-300"
                onClick={() => navigate(`/marketplace/${product._id}`)}
              />
              <div className="flex-1">
                <h3
                  className="text-xl text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 cursor-pointer"
                  onClick={() => navigate(`/marketplace/${product._id}`)}
                >
                  {product.title}
                </h3>
                <p className="text-green-400 font-semibold">₹{product.price}</p>
                <p className={`text-sm ${product.sold ? "text-red-400" : "text-gray-300"}`}>
                  {product.sold ? "Sold ✅" : "Available"}
                </p>
              </div>
              <div className="flex space-x-2">
                <Link 
                  to={`/marketplace/edit/${product._id}`} 
                  className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg transition-all duration-300 hover:shadow-lg"
                >
                  Edit ✏️
                </Link>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteProduct(product._id);
                  }}
                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg transition-all duration-300 hover:shadow-lg"
                >
                  Delete 🗑
                </button>
                {!product.sold && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      markAsSold(product._id);
                    }}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-lg transition-all duration-300 hover:shadow-lg"
                  >
                    Mark as Sold 🏷
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyListings;
