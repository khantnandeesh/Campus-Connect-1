// src/pages/MyOrders.jsx
import { useState, useEffect } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";

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
      <div className="min-h-screen flex justify-center items-center bg-gray-900">
        <p className="text-gray-400">Loading orders...</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-gray-900">
        <p className="text-gray-400">You have no orders yet.</p>
        <button
          onClick={() => navigate("/marketplace")}
          className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          Back to Marketplace
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-900 min-h-screen text-white">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-center">My Orders</h1>
        <button
          onClick={() => navigate("/marketplace")}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          Back to Marketplace
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {orders.map((order) => (
          <div key={order._id} className="bg-gray-800 p-4 rounded-lg shadow-md border border-gray-700">
            <img src={order.images[0]} alt={order.title} className="w-full h-40 object-cover rounded" />
            <h2 className="mt-4 text-xl font-semibold">{order.title}</h2>
            <p className="text-green-400 font-semibold">₹{order.price}</p>
            <p className="mt-2 text-gray-400">Order Date: {new Date(order.createdAt).toLocaleDateString()}</p>
            <Link
              to={`/marketplace/${order._id}`}
              className="mt-4 inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
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
