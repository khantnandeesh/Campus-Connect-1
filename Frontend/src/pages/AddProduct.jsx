import { useState } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

const AddProduct = () => {
  const { token } = useSelector((state) => state.auth); // Get token from Redux
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    category: "",
    condition: "new",
    images: [],
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageUpload = async (e) => {
    const files = e.target.files;
    const uploadedImages = [];

    for (let file of files) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "your_cloudinary_preset"); // Replace with your Cloudinary preset

      const response = await axios.post(
        "https://api.cloudinary.com/v1_1/your_cloud_name/image/upload",
        formData
      );

      uploadedImages.push(response.data.secure_url);
    }

    setFormData({ ...formData, images: uploadedImages });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        "http://localhost:5000/api/products",
        formData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("Product added:", response.data);
      navigate("/marketplace"); // Redirect to the marketplace page
    } catch (error) {
      console.error("Error adding product:", error);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-bold mb-4">Add a Product</h2>
      <form onSubmit={handleSubmit}>
        <input type="text" name="title" placeholder="Title" required onChange={handleChange} className="border p-2 w-full mb-3"/>
        <textarea name="description" placeholder="Description" required onChange={handleChange} className="border p-2 w-full mb-3"/>
        <input type="number" name="price" placeholder="Price" required onChange={handleChange} className="border p-2 w-full mb-3"/>
        <select name="category" required onChange={handleChange} className="border p-2 w-full mb-3">
          <option value="">Select Category</option>
          <option value="electronics">Electronics</option>
          <option value="books">Books</option>
          <option value="clothing">Clothing</option>
        </select>
        <select name="condition" required onChange={handleChange} className="border p-2 w-full mb-3">
          <option value="new">New</option>
          <option value="used">Used</option>
        </select>
        <input type="file" multiple onChange={handleImageUpload} className="border p-2 w-full mb-3"/>
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">Add Product</button>
      </form>
    </div>
  );
};

export default AddProduct;
