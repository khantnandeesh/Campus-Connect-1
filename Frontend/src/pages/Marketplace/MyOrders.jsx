import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { Toaster, toast } from "react-hot-toast";
import { useSelector } from "react-redux";
const MyOrders = () => {
  const user = useSelector((state) => state.auth.user);
  const userId = user?._id;
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!userId) return;
    const fetchOrders = async () => {
      try {
        const response = await axios.get("http://localhost:3000/api/marketplace/orders", { withCredentials: true });
        setOrders(response.data);
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [userId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex justify-center items-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-gray-900 to-black">
        <Toaster position="top-right" reverseOrder={false} />
        <p className="text-2xl text-gray-400 mb-6">You have no orders yet.</p>
        <button
          onClick={() => navigate("/marketplace")}
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition-all duration-300 hover:shadow-lg"
        >
          Browse Marketplace
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gradient-to-br from-gray-900 to-black min-h-screen text-white">
      <Toaster position="top-right" reverseOrder={false} />
      
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-600 drop-shadow-lg">
          My Orders
        </h1>
        <button
          onClick={() => navigate("/marketplace")}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-all duration-300 hover:shadow-lg"
        >
          Back to Marketplace
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {orders.map((order) => (
          <div 
            key={order._id} 
            className="bg-gray-800 p-4 rounded-lg shadow-xl border border-gray-700 relative hover:scale-105 transition-all duration-300 hover:shadow-2xl"
          >
            <img 
              src={order.images[0]} 
              alt={order.title} 
              className="w-full h-48 object-cover rounded-lg border-2 border-transparent hover:border-blue-500 transition-all duration-300" 
            />
            <h2 className="mt-4 text-xl font-medium text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
              {order.title}
            </h2>
            <p className="text-green-400 text-lg font-semibold">₹{order.price}</p>
            <p className="mt-2 text-gray-400">
              Order Date: {new Date(order.createdAt).toLocaleDateString()}
            </p>
            <Link
              to={`/marketplace/${order._id}`}
              className="mt-4 inline-block bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-all duration-300 hover:shadow-lg"
            >
              View Details
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyOrders;
