import { useEffect, useState } from "react";
import axios from "axios";
import { useSelector } from "react-redux";

const Marketplace = () => {
  const [products, setProducts] = useState([]);
  const user = useSelector((state) => state.auth.user);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await axios.get("http://localhost:3000/api/products");
        const allProducts = res.data;

        const filteredProducts = allProducts.filter(
          (product) => product.sellerId !== user?._id
        );

        setProducts(filteredProducts);
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };

    fetchProducts();
  }, [user]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Marketplace</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {products.map((product) => (
          <div key={product._id} className="border p-4 rounded shadow-lg">
            <img src={product.images[0]} alt={product.name} className="w-full h-40 object-cover rounded" />
            <h2 className="text-lg font-semibold mt-2">{product.name}</h2>
            <p className="text-gray-700">₹{product.price}</p>
            <button className="mt-2 bg-blue-500 text-white px-4 py-2 rounded">
              View Details
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Marketplace;
