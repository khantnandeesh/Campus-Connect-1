import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

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
      } else {
        await axios.post("http://localhost:3000/api/marketplace/products", formData, {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        });
      }

      navigate("/marketplace");
    } catch (error) {
      console.error("Error submitting product:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-900 min-h-screen flex justify-center items-center">
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700 max-w-lg w-full">
        <h2 className="text-2xl font-bold text-white mb-4">{id ? "Edit Product" : "Add Product"}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" placeholder="Title" className="w-full p-2 border rounded bg-gray-700 text-white" value={title} onChange={(e) => setTitle(e.target.value)} required />
          <textarea placeholder="Description" className="w-full p-2 border rounded bg-gray-700 text-white" value={description} onChange={(e) => setDescription(e.target.value)} />
          <input type="number" placeholder="Price" className="w-full p-2 border rounded bg-gray-700 text-white" value={price} onChange={(e) => setPrice(e.target.value)} required />
          <select className="w-full p-2 border rounded bg-gray-700 text-white" value={category} onChange={(e) => setCategory(e.target.value)} required>
            <option value="" disabled>Select Category</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="text-white" />
          <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700" disabled={loading}>
            {loading ? "Submitting..." : id ? "Update Product" : "Add Product"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddEditProduct;
