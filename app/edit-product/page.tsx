'use client';

import { useRouter } from 'next/navigation';
import { collection, doc, getDocs, query, setDoc, getDoc, where, orderBy, onSnapshot, deleteDoc, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { auth, db } from '@/app/src/firebase';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { toast } from 'sonner';
import { Toaster } from 'sonner';
import { Input } from '@/components/ui/input';
import { Search, Edit, Trash2, Plus } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import tr from "../../images/Grocery/Aashirvaad Shudh Chakki Atta/0.jpg";
import { CustomPagination } from '@/components/CustomPagination';

interface Product {
  id: string;
  productName: string;
  price: number;
  discountedPrice: number;
  imageUrl: string;
  quantity: string;
  description: string;
  category: string;
}

interface ProductImages {
  [key: string]: string
  productId: string
}

const EditProduct = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editForm, setEditForm] = useState<Product | null>(null);
  const [productImages, setProductImages] = useState<{ [key: string]: string[] }>({});
  const router = useRouter();
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [role, setRole] = useState<string | null>(null);

  // Checking login user role
    useEffect(() => {
      const unsubscribe = auth.onAuthStateChanged(async (user) => {
        if (user) {
          setLoading(true);
          try {
            const userRef = doc(db, 'users', user.uid);
            const userSnap = await getDoc(userRef);
    
            if (userSnap.exists()) {
              const userRole = userSnap.data()?.role;
              setRole(userRole);
    
              if (userRole !== 'admin' && userRole !== 'superadmin') {
                router.push('/');
              }
            } else {
              router.push('/');
            }
          } catch (error) {
            console.error('Error checking user role:', error);
            router.push('/');
          } finally {
            setLoading(false);
          }
        } else {
          router.push('/');
        }
      });
    
      return () => unsubscribe();
    }, [router]);
  

  // Fetch products from Firebase
  useEffect(() => {
    setLoading(true);
    
    const productQuery = query(
      collection(db, 'products'),
    );
    
    const unsubscribe = onSnapshot(productQuery, (snapshot) => {
      const productList = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          productName: data.productName,
          description: data.description,
          price: parseFloat(data.price),
          discountedPrice: parseFloat(data.discountedPrice),
          imageUrl: data.imageUrl,
          quantity: data.quantity || '0',
          category: data.category || 'Uncategorized',
        } as Product;
      });
      
      setProducts(productList);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching real-time products:", error);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (products.length === 0) return; // Only fetch product images if there are products
  
    const fetchProductImages = async () => {
      try {
        // Create a map to hold the images for each product by id
        const productImagesMap: { [key: string]: string[] } = {};
  
        // Use Promise.all to fetch images for all products concurrently
        await Promise.all(
          products.map(async (product) => {
            const productImagesRef = doc(db, "productImages", product.id);
            const productImagesDoc = await getDoc(productImagesRef);
  
            let images: string[] = [];
            if (productImagesDoc.exists()) {
              const imagesData = productImagesDoc.data() as ProductImages;
              let index = 0;
              while (imagesData[`imageUrl${index === 0 ? "" : index}`]) {
                images.push(imagesData[`imageUrl${index === 0 ? "" : index}`]);
                index++;
              }
            } else {
              images = [product.imageUrl]; // Use product's main image if no additional images exist
            }
  
            // Add the images to the map
            productImagesMap[product.id] = images;
          })
        );
  
        // Set the product images state once all images are fetched
        setProductImages(productImagesMap);
      } catch (error) {
        console.error("Error fetching product images:", error);
      }
    };
  
    fetchProductImages();
  }, [products]);
  

  // Filtered products by searching
  const filteredProducts = products.filter(
    (product) =>
      product.productName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.discountedPrice?.toString().includes(searchTerm.toLowerCase())
  );

  const indexOfLastCategory = currentPage * itemsPerPage;
  const indexOfFirstCategory = indexOfLastCategory - itemsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstCategory, indexOfLastCategory);

  // Handle opening edit modal
  const handleEditClick = (product: Product) => {
    setSelectedProduct(product);
    setEditForm({...product});
    setIsEditModalOpen(true);
  };

  // Handle opening delete modal
  const handleDeleteClick = (product: Product) => {
    setSelectedProduct(product);
    setIsDeleteModalOpen(true);
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (editForm) {
      setEditForm({
        ...editForm,
        [name]: name === 'price' || name === 'discountedPrice' 
          ? parseFloat(value) 
          : value
      });
    }
  };

  // Save edited product to Firebase
  const handleSaveEdit = async () => {
    if (!editForm || !selectedProduct) return;
    
    try {
      setLoading(true);
      const productRef = doc(db, 'products', selectedProduct.id);
      
      await updateDoc(productRef, {
        productName: editForm.productName,
        description: editForm.description,
        price: editForm.price.toString(),
        discountedPrice: editForm.discountedPrice.toString(),
        imageUrl: editForm.imageUrl,
        quantity: editForm.quantity,
        category: editForm.category,
      });
      
      setIsEditModalOpen(false);
      setSelectedProduct(null);
      toast.success('Product updated successfully!');
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('Failed to update product');
    } finally {
      setLoading(false);
    }
  };

  // Delete product from Firebase
  const handleDeleteConfirm = async () => {
    if (!selectedProduct) return;
    
    try {
      setLoading(true);
      await deleteDoc(doc(db, 'products', selectedProduct.id));
      
      setIsDeleteModalOpen(false);
      setSelectedProduct(null);
      toast.success('Product deleted successfully!');
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
    } finally {
      setLoading(false);
    }
  };

  // Navigate to add product page
  const handleAddProductClick = () => {
    router.push('/add-product');
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-16 w-16 border-4 border-gray-300 border-t-green-700 rounded-full animate-spin"></div>
      </div>
    );
  } 
  
  if (role !== 'admin' && role !== 'superadmin') {
    return null;
  }

  return (
    <>
      <Toaster />
      <div className='flex flex-col bg-gradient-to-b from-gray-50 to-gray-100 min-h-screen pb-20'>
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Product Management</h1>
            <Button 
              onClick={handleAddProductClick}
              className="bg-green-700 hover:bg-green-800 text-white"
            >
              <Plus className="mr-2 h-4 w-4" /> Add Product
            </Button>
          </div>

          {/* Search Bar */}
          <div className="relative mb-6">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <Input
              type="text"
              placeholder="Search by product name, description, category or price..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-gray-300 pl-10 py-3 rounded-lg focus:outline-none focus:ring-2 transition"
            />
          </div>

          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentProducts.length > 0 ? (
                    currentProducts.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              {product.imageUrl ? (
                                <img
                                  src={product.imageUrl} 
                                  alt={product.productName}
                                  className="h-10 w-10 rounded-md object-cover" 
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-md bg-gray-200 flex items-center justify-center">
                                  <span className="text-xs text-gray-500">No img</span>
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 max-w-80 truncate">{product.productName}</div>
                              <div className="text-sm text-gray-500 line-clamp-1">{product.description}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-700">
                            {product.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">₹{product.discountedPrice}</div>
                          {product.price > product.discountedPrice && (
                            <div className="text-xs text-gray-500 line-through">₹{product.price}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm ${parseInt(product.quantity) > 0 ? 'text-green-700' : 'text-red-600'}`}>
                            {parseInt(product.quantity) > 0 ? product.quantity : 'Out of stock'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Button
                            onClick={() => handleEditClick(product)}
                            variant="ghost"
                            size="sm"
                            className="text-blue-500 hover:text-blue-500 bg-blue-100 hover:bg-blue-100 border border-blue-500 cursor-pointer mr-2"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            onClick={() => handleDeleteClick(product)}
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-500 bg-red-100 hover:bg-red-100 border-red-500 border cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                        No products found matching "{searchTerm}"
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              {filteredProducts.length > 0 && (
                <CustomPagination
                  totalCount={filteredProducts.length}
                  page={currentPage}
                  pageSize={itemsPerPage}
                  onPageChange={(newPage) => setCurrentPage(newPage)}
                  onPageSizeChange={(newSize) => {
                    setItemsPerPage(Number(newSize));
                    setCurrentPage(1);
                  }}
                  pageSizeOptions={[3, 5, 10, 15, 20, 50]}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Product Modal */}
      {selectedProduct && (
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Product</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="productName" className="text-right text-sm font-medium">Name</label>
                <Input
                  id="productName"
                  name="productName"
                  value={editForm?.productName || ''}
                  onChange={handleInputChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="category" className="text-right text-sm font-medium">Category</label>
                <Input
                  id="category"
                  name="category"
                  value={editForm?.category || ''}
                  onChange={handleInputChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="description" className="text-right text-sm font-medium">Description</label>
                <Input
                  id="description"
                  name="description"
                  value={editForm?.description || ''}
                  onChange={handleInputChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="price" className="text-right text-sm font-medium">Price</label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  value={editForm?.price || 0}
                  onChange={handleInputChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="discountedPrice" className="text-right text-sm font-medium">Discounted Price</label>
                <Input
                  id="discountedPrice"
                  name="discountedPrice"
                  type="number"
                  value={editForm?.discountedPrice || 0}
                  onChange={handleInputChange}
                  className="col-span-3"
                />
              </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="imageUrl" className="text-right text-sm font-medium">Images</label>
                  <div className="col-span-3">
                    {productImages[selectedProduct.id]?.map((imageUrl, index) => (
                      <div key={index} className="mb-2">
                        <img 
                          src={imageUrl}
                          alt={`Product Image ${index + 1}`} 
                          className="min-w-16 h-16 border rounded"
                        />
                      </div>
                    ))}
                  </div>
              </div>

        <div className="grid grid-cols-4 items-center gap-4">
          <label htmlFor="imageUrl" className="text-right text-sm font-medium">Update Image URL</label>
          <Input
            id="imageUrl"
            name="imageUrl"
            value={editForm?.imageUrl || ''}
            onChange={handleInputChange}
            className="col-span-3"
          />
        </div>

            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveEdit} className="bg-green-700 text-white hover:bg-green-800">Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Are you sure you want to delete the product "{selectedProduct?.productName}"?</p>
            <p className="text-sm text-red-500 mt-2">This action cannot be undone.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
            <Button onClick={handleDeleteConfirm} className="bg-red-600 text-white hover:bg-red-700">Delete Product</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EditProduct;