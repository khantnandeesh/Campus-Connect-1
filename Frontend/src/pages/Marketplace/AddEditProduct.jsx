import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Toaster, toast } from "react-hot-toast";

const categories = ["Electronics", "Books", "Clothing", "Furniture", "Sports", "Accessories", "Miscellaneous"];

const AddEditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) {
      const fetchProduct = async () => {
        try {
          const response = await axios.get(`http://localhost:3000/api/marketplace/products/${id}`);
          const { title, description, price, category, images } = response.data;
          setTitle(title);
          setDescription(description);
          setPrice(price);
          setCategory(category);
          setImages(images);
        } catch (error) {
          console.error("Error fetching product:", error);
          toast.error("Failed to load product details");
        }
      };
      fetchProduct();
    }
  }, [id]);

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    setImages((prev) => [...prev, ...files]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("price", price);
      formData.append("category", category);
      images.forEach((image) => formData.append("images", image));

      if (id) {
        await axios.put(`http://localhost:3000/api/marketplace/products/${id}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        });
        toast.success("Product updated successfully!");
      } else {
        await axios.post("http://localhost:3000/api/marketplace/products", formData, {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        });
        toast.success("Product added successfully!");
      }

      navigate("/marketplace");
    } catch (error) {
      console.error("Error submitting product:", error);
      toast.error("Failed to submit product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gradient-to-br from-gray-900 to-black min-h-screen flex justify-center items-center">
      <Toaster position="top-right" reverseOrder={false} />
      
      <div className="bg-gray-800 p-6 rounded-lg shadow-2xl border border-gray-700 max-w-lg w-full">
        <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-600 drop-shadow-lg mb-6 text-center">
          {id ? "Edit Product" : "Add Product"}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <input 
            type="text" 
            placeholder="Title" 
            className="w-full p-3 border rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            required 
          />
          
          <textarea 
            placeholder="Description" 
            className="w-full p-3 border rounded bg-gray-700 text-white min-h-[100px] focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300" 
            value={description} 
            onChange={(e) => setDescription(e.target.value)} 
          />
          
          <input 
            type="number" 
            placeholder="Price" 
            className="w-full p-3 border rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300" 
            value={price} 
            onChange={(e) => setPrice(e.target.value)} 
            required 
          />
          
          <select 
            className="w-full p-3 border rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300" 
            value={category} 
            onChange={(e) => setCategory(e.target.value)} 
            required
          >
            <option value="" disabled>Select Category</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          
          <input 
            type="file" 
            multiple 
            accept="image/*" 
            onChange={handleImageUpload} 
            className="text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:bg-blue-500 file:text-white hover:file:bg-blue-600" 
          />
          
          <button 
            type="submit" 
            className="w-full bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 transition-all duration-300 flex items-center justify-center" 
            disabled={loading}
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white"></div>
            ) : (
              id ? "Update Product" : "Add Product"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddEditProduct;
