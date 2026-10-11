import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const ProductManagerPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Placeholder product data for Admin Product Management
    setProducts([
      { id: 1, name: 'Sample Product 1', price: '$19.99', category: 'Electronics' },
      { id: 2, name: 'Sample Product 2', price: '$29.99', category: 'Clothing' },
    ]);
    setLoading(false);
  }, []);

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Product Management</h1>
        <Link
          to="/admin/products/new"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Add New Product
        </Link>
      </div>

      {loading ? (
        <p>Loading products...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr className="w-full bg-gray-100 border-b">
                <th className="py-2 px-4 text-left">ID</th>
                <th className="py-2 px-4 text-left">Name</th>
                <th className="py-2 px-4 text-left">Category</th>
                <th className="py-2 px-4 text-left">Price</th>
                <th className="py-2 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-b hover:bg-gray-50">
                  <td className="py-2 px-4">{product.id}</td>
                  <td className="py-2 px-4">{product.name}</td>
                  <td className="py-2 px-4">{product.category}</td>
                  <td className="py-2 px-4">{product.price}</td>
                  <td className="py-2 px-4 text-center space-x-2">
                    <Link
                      to={`/admin/products/edit/${product.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      Edit
                    </Link>
                    <button className="text-red-600 hover:underline">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ProductManagerPage;