"use client";

import type React from "react";

<<<<<<< HEAD
import { auth, db } from "@/app/src/firebase";
import { CustomPagination } from "@/components/CustomPagination";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { collection, deleteDoc, doc, getDoc, onSnapshot, query, setDoc, updateDoc } from "firebase/firestore";
import { Calendar, CalendarX2, Edit, Ellipsis, Eye, IndianRupee, Layers, Package, Plus, Search, Tag, Trash2, Upload, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast, Toaster } from "sonner";
=======
import { useRouter } from "next/navigation";
import { collection, doc, query, setDoc, getDoc, onSnapshot, deleteDoc, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { auth, db } from "@/app/src/firebase";
import { toast } from "sonner";
import { Toaster } from "sonner";
import { Input } from "@/components/ui/input";
import { Search, Edit, Trash2, Plus, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { CustomPagination } from "@/components/CustomPagination";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
>>>>>>> 59873b96c42cfe60dc7dfeab75aca9d342466692

interface Product {
  id: string;
  productName: string;
  price: number;
  discountedPrice: number;
  imageUrl: string;
  quantity: string;
  description: string;
  category: string;
  buckleNumber: number;
  expiresAt: string;
  manufacturedAt: string;
}

interface ProductImages {
  [key: string]: string;
  productId: string;
}

const EditProduct = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editForm, setEditForm] = useState<Product | null>(null);
  const [productImages, setProductImages] = useState<{ [key: string]: string[] }>({});
  const [selectedProductImages, setSelectedProductImages] = useState<string[]>([]);
  const [imagesToDelete, setImagesToDelete] = useState<number[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("details");
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
          const userRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            const userRole = userSnap.data()?.role;
            setRole(userRole);

            if (userRole !== "admin" && userRole !== "superadmin") {
              router.push("/");
            }
          } else {
            router.push("/");
          }
        } catch (error) {
          console.error("Error checking user role:", error);
          router.push("/");
        } finally {
          setLoading(false);
        }
      } else {
        router.push("/");
      }
    })

    return () => unsubscribe();
  }, [router])

  // Fetch products from Firebase
  useEffect(() => {
    setLoading(true);

    const productQuery = query(collection(db, "products"));

    const unsubscribe = onSnapshot(
      productQuery,
      (snapshot) => {
        const productList = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            productName: data.productName,
            description: data.description,
            price: Number.parseFloat(data.price),
            discountedPrice: Number.parseFloat(data.discountedPrice),
            imageUrl: data.imageUrl,
            quantity: data.quantity || "0",
<<<<<<< HEAD
            category: data.category,
            buckleNumber: data.buckleNumber,
            expiresAt: data.expiresAt,
            manufacturedAt: data.manufacturedAt,
=======
            category: data.category || "Uncategorized",
>>>>>>> 59873b96c42cfe60dc7dfeab75aca9d342466692
          } as Product
        })

        setProducts(productList);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching real-time products:", error);
        setLoading(false);
      },
    )

    return () => unsubscribe();
  }, [])

  useEffect(() => {
    if (products.length === 0) return;

    const productImagesMap: { [key: string]: string[] } = {}

    const unsubscribeFunctions: (() => void)[] = []

    products.forEach((product) => {
      const productImagesRef = doc(db, "productImages", product.id);

      const unsubscribe = onSnapshot(
        productImagesRef,
        (doc) => {
          if (doc.exists()) {
            const imagesData = doc.data() as ProductImages;
            const images: string[] = [];
            let index = 0;

            while (imagesData[`imageUrl${index === 0 ? "" : index}`]) {
              const imageUrl = imagesData[`imageUrl${index === 0 ? "" : index}`]
              if (imageUrl && typeof imageUrl === "string" && imageUrl.trim() !== "") {
                images.push(imageUrl);
              }
              index++;
            }

            productImagesMap[product.id] = images;

            setProductImages((prevState) => ({
              ...prevState,
              [product.id]: images,
            }))

            if (selectedProduct && selectedProduct.id === product.id) {
              setSelectedProductImages(images);
            }
          } else {
            productImagesMap[product.id] = product.imageUrl ? [product.imageUrl] : [];

            setProductImages((prevState) => ({
              ...prevState,
              [product.id]: product.imageUrl ? [product.imageUrl] : [],
            }))
          }
        },
        (error) => {
          console.error(`Error fetching real-time images for product ${product.id}:`, error);
        },
      )

      unsubscribeFunctions.push(unsubscribe);
    })

    return () => {
      unsubscribeFunctions.forEach((unsubscribe) => unsubscribe());
    }
  }, [products, selectedProduct])

  const filteredProducts = products.filter(
    (product) =>
      product.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
<<<<<<< HEAD
      product.quantity?.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.discountedPrice?.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.buckleNumber?.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.discountedPrice?.toString().includes(searchTerm.toLowerCase()),
  )

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);
=======
      product.discountedPrice?.toString().includes(searchTerm.toLowerCase()),
  )
>>>>>>> 59873b96c42cfe60dc7dfeab75aca9d342466692

  const indexOfLastCategory = currentPage * itemsPerPage;
  const indexOfFirstCategory = indexOfLastCategory - itemsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstCategory, indexOfLastCategory);

<<<<<<< HEAD
  // Handle view product
  const handleViewClick = (product: Product) => {
    setSelectedProduct(product); 
    setIsViewModalOpen(true);
  }

  // Handle edit product
  const handleEditClick = (product: Product) => {
    setSelectedProduct(product);
    setEditForm({ ...product });

    const images = productImages[product.id] || [];

    setSelectedProductImages(images.length > 0 ? images : product.imageUrl ? [product.imageUrl] : []);
    setImagesToDelete([]);
    setNewImages([]);
    setNewImagePreviews([]);
    setActiveTab("details");
    setIsEditModalOpen(true);
  }

  // Handle delete product
=======
  const handleEditClick = (product: Product) => {
    setSelectedProduct(product);
    setEditForm({ ...product });

    const images = productImages[product.id] || [];

    setSelectedProductImages(images.length > 0 ? images : product.imageUrl ? [product.imageUrl] : []);
    setImagesToDelete([]);
    setNewImages([]);
    setNewImagePreviews([]);
    setActiveTab("details");
    setIsEditModalOpen(true);
  }

>>>>>>> 59873b96c42cfe60dc7dfeab75aca9d342466692
  const handleDeleteClick = (product: Product) => {
    setSelectedProduct(product);
    setIsDeleteModalOpen(true);
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (editForm) {
      setEditForm({
        ...editForm,
        [name]: name === "price" || name === "discountedPrice" ? Number.parseFloat(value) : value,
      })
    }
  }
<<<<<<< HEAD

  // Converting image file to base64 url
  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        resolve(reader.result as string);
      }
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    })
  }

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      setNewImages((prev) => [...prev, ...fileArray]);

      try {
        const newPreviews = await Promise.all(fileArray.map((file) => convertToBase64(file)))
        setNewImagePreviews((prev) => [...prev, ...newPreviews]);
      } catch (error) {
        console.error("Error creating previews:", error);
        toast.error("Failed to create image previews");
      }
      e.target.value = '';
    }
  }

  // Handle delete image
  const removeNewImage = (index: number) => {
    const updatedImages = [...newImages];
    updatedImages.splice(index, 1);
    setNewImages(updatedImages);

    const updatedPreviews = [...newImagePreviews];
    updatedPreviews.splice(index, 1);
    setNewImagePreviews(updatedPreviews);
  }

  const toggleImageForDeletion = (index: number) => {
    if (imagesToDelete.includes(index)) {
      setImagesToDelete(imagesToDelete.filter((i) => i !== index));
    } else {
      setImagesToDelete([...imagesToDelete, index]);
    }
  }

  const clearAllNewImages = () => {
    setNewImages([]);
    setNewImagePreviews([]);
  }

  // Handle edit product details
=======

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        resolve(reader.result as string);
      }
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    })
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      setNewImages((prev) => [...prev, ...fileArray]);

      try {
        const newPreviews = await Promise.all(fileArray.map((file) => convertToBase64(file)))
        setNewImagePreviews((prev) => [...prev, ...newPreviews]);
      } catch (error) {
        console.error("Error creating previews:", error);
        toast.error("Failed to create image previews");
      }
    }
  }

  const removeNewImage = (index: number) => {
    const updatedImages = [...newImages];
    updatedImages.splice(index, 1);
    setNewImages(updatedImages);

    const updatedPreviews = [...newImagePreviews];
    updatedPreviews.splice(index, 1);
    setNewImagePreviews(updatedPreviews);
  }

  const toggleImageForDeletion = (index: number) => {
    if (imagesToDelete.includes(index)) {
      setImagesToDelete(imagesToDelete.filter((i) => i !== index));
    } else {
      setImagesToDelete([...imagesToDelete, index]);
    }
  }

  const clearAllNewImages = () => {
    setNewImages([]);
    setNewImagePreviews([]);
  }

>>>>>>> 59873b96c42cfe60dc7dfeab75aca9d342466692
  const handleSaveEdit = async () => {
    if (!editForm || !selectedProduct) return;

    try {
      setLoading(true)
      const productRef = doc(db, "products", selectedProduct.id);

      const currentImages = selectedProductImages.filter((_, index) => !imagesToDelete.includes(index));

      const newImageBase64 = await Promise.all(newImages.map((file) => convertToBase64(file)));

      const allImages = [...currentImages, ...newImageBase64];

      let mainImageUrl = editForm.imageUrl;

      if (allImages.length > 0) {
        mainImageUrl = allImages[0];

        const imagesData: Record<string, string> = {
          productId: selectedProduct.id,
        }

        allImages.forEach((imageUrl, index) => {
          imagesData[`imageUrl${index === 0 ? "" : index}`] = imageUrl;
        })

        await setDoc(doc(db, "productImages", selectedProduct.id), imagesData)
      }

      await updateDoc(productRef, {
        productName: editForm.productName,
        description: editForm.description,
        price: editForm.price.toString(),
        discountedPrice: editForm.discountedPrice.toString(),
        imageUrl: mainImageUrl,
        quantity: editForm.quantity,
        category: editForm.category,
      })

      setIsEditModalOpen(false);
      setSelectedProduct(null);
      setImagesToDelete([]);
      setNewImages([]);
      setNewImagePreviews([]);
<<<<<<< HEAD
      toast.success("Product updated successfully!",{
        style: { color: "green" }
      });
=======
      toast.success("Product updated successfully!");
>>>>>>> 59873b96c42cfe60dc7dfeab75aca9d342466692
    } catch (error) {
      console.error("Error updating product:", error);
      toast.error("Failed to update product");
    } finally {
      setLoading(false);
    }
  }

  // Delete product from Firebase
  const handleDeleteConfirm = async () => {
    if (!selectedProduct) return;

    try {
      setLoading(true);
      await deleteDoc(doc(db, "products", selectedProduct.id));

      await deleteDoc(doc(db, "productImages", selectedProduct.id));

      setIsDeleteModalOpen(false);
      setSelectedProduct(null);
<<<<<<< HEAD
      toast.success("Product deleted successfully!",{
        style: { color: "red" }
      });
=======
      toast.success("Product deleted successfully!");
>>>>>>> 59873b96c42cfe60dc7dfeab75aca9d342466692
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Failed to delete product");
    } finally {
      setLoading(false);
    }
  }

  // Navigate to add product page
  const handleAddProductClick = () => {
    router.push("/add-product");
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-16 w-16 border-4 border-gray-300 border-t-green-700 rounded-full animate-spin"></div>
      </div>
    )
  }

  if (role !== "admin" && role !== "superadmin") {
    return null;
  }

  return (
    <>
      <Toaster />
      <div className="flex flex-col bg-gradient-to-b from-gray-50 to-gray-100 min-h-screen pb-20">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Product Management</h1>
            <Button onClick={handleAddProductClick} className="bg-green-700 hover:bg-green-800 text-white">
<<<<<<< HEAD
              <Plus className="h-4 w-4" /> Add Product
=======
              <Plus className="mr-2 h-4 w-4" /> Add Product
>>>>>>> 59873b96c42cfe60dc7dfeab75aca9d342466692
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
                          <div className="flex-shrink-0 h-12 w-12 rounded-md overflow-hidden border border-gray-200 shadow-sm">
                              {product.imageUrl ? (
                                <img
                                  src={product.imageUrl || "/placeholder.svg"}
                                  alt={product.productName}
<<<<<<< HEAD
                                  className="h-12 w-12 object-cover"
=======
                                  className="h-10 w-10 rounded-md object-cover"
>>>>>>> 59873b96c42cfe60dc7dfeab75aca9d342466692
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement
                                    target.src = "/placeholder.svg?height=40&width=40"
                                    target.onerror = null
                                  }}
                                />
                              ) : (
                                <div className="h-12 w-12 bg-gray-100 flex items-center justify-center">
                                  <span className="text-xs text-gray-500">No img</span>
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 max-w-80 truncate">
                                {product.productName}
                              </div>
                              <div className="text-sm text-gray-500 line-clamp-1">{product.description}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
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
<<<<<<< HEAD
                        <div
                            className={`text-sm font-medium ${
                              Number.parseInt(product.quantity) > 0
                                ? Number.parseInt(product.quantity) < 50
                                  ? "text-yellow-500"
                                  : "text-green-700"
                                : "text-red-600"
                            }`}
                          >
                            <span className="text-base">
                            {Number.parseInt(product.quantity) > 0 ? product.quantity : "Out of stock"}
                            </span>
                            {Number.parseInt(product.quantity) > 0 && Number.parseInt(product.quantity) < 50 && (
                              <span className="ml-1 text-xs bg-yellow-100 px-2 py-0.5 rounded-full text-yellow-600">
                                Low Stock
                              </span>
                            )}
=======
                          <div
                            className={`text-sm ${Number.parseInt(product.quantity) > 0 ? "text-green-700" : "text-red-600"}`}
                          >
                            {Number.parseInt(product.quantity) > 0 ? product.quantity : "Out of stock"}
>>>>>>> 59873b96c42cfe60dc7dfeab75aca9d342466692
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Popover>
                            <PopoverTrigger asChild>
                              <button className="p-1 bg-green-100 hover:bg-green-200 rounded-md border-green-700 border">
                                <Ellipsis className="text-green-700 w-5 h-5"/>
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-30"  side="bottom" align="end">
                              <div className="grid gap-2">
                              <Button
                                onClick={() => handleViewClick(product)}
                                variant="ghost"
                                size="sm"
                                className="text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 cursor-pointer transition-all duration-200"
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                              <Button
                                onClick={() => handleEditClick(product)}
                                variant="ghost"
                                size="sm"
                                className="text-yellow-600 hover:text-yellow-700 bg-yellow-50 hover:bg-yellow-100 border border-yellow-200 cursor-pointer transition-all duration-200"
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                              <Button
                                onClick={() => handleDeleteClick(product)}
                                variant="ghost"
                                size="sm"
                                className="w-full text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border-red-200 border cursor-pointer transition-all duration-200"
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Delete
                              </Button>
                              </div>
                            </PopoverContent>
                          </Popover>
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
              <div className="pb-4 pl-6 border-t">
              {filteredProducts.length > 0 && (
                <CustomPagination
                  totalCount={filteredProducts.length}
                  page={currentPage}
                  pageSize={itemsPerPage}
                  onPageChange={(newPage) => setCurrentPage(newPage)}
                  onPageSizeChange={(newSize) => {
                    setItemsPerPage(Number(newSize))
                    setCurrentPage(1)
                  }}
                  pageSizeOptions={[3, 5, 10, 15, 20, 50]}
                />
              )}
              </div>
            </div>
          </div>
        </div>
      </div>

<<<<<<< HEAD
      {selectedProduct && (
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="sm:max-w-2xl md:max-w-xl max-h-[90vh] overflow-hidden flex flex-col">
=======
      {/* Edit Product Modal with Tabs and Scrollable Content */}
      {selectedProduct && (
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
>>>>>>> 59873b96c42cfe60dc7dfeab75aca9d342466692
            <DialogHeader className="pb-2">
              <DialogTitle>Edit Product: {selectedProduct.productName}</DialogTitle>
            </DialogHeader>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
              <TabsList className="grid grid-cols-2 mb-2">
                <TabsTrigger value="details">Product Details</TabsTrigger>
                <TabsTrigger value="images">Product Images</TabsTrigger>
              </TabsList>

              <div className="overflow-y-auto flex-1 pr-2 -mr-2">
                <TabsContent value="details" className="mt-0 h-full">
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <label htmlFor="productName" className="text-right text-sm font-medium">
                        Name
                      </label>
                      <Input
                        id="productName"
                        name="productName"
                        value={editForm?.productName || ""}
                        onChange={handleInputChange}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <label htmlFor="category" className="text-right text-sm font-medium">
                        Category
                      </label>
                      <Input
                        id="category"
                        name="category"
                        value={editForm?.category || ""}
                        onChange={handleInputChange}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <label htmlFor="description" className="text-right text-sm font-medium">
                        Description
                      </label>
                      <Input
                        id="description"
                        name="description"
                        value={editForm?.description || ""}
                        onChange={handleInputChange}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <label htmlFor="price" className="text-right text-sm font-medium">
                        Price
                      </label>
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
                      <label htmlFor="discountedPrice" className="text-right text-sm font-medium">
                        Discounted Price
                      </label>
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
                      <label htmlFor="quantity" className="text-right text-sm font-medium">
                        Quantity
                      </label>
                      <Input
                        id="quantity"
                        name="quantity"
                        type="number"
                        value={editForm?.quantity || 0}
                        onChange={handleInputChange}
                        className="col-span-3"
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="images" className="mt-0 h-full">
                  <div className="grid gap-6 py-4">
                    <div className="grid gap-2">
                      <div className="flex justify-between items-center">
                        <label className="text-sm font-medium">Current Images</label>
                        <span className="text-xs text-gray-500">
                          {selectedProductImages.length} image{selectedProductImages.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                      {selectedProductImages.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {selectedProductImages.map((imageUrl, index) => (
<<<<<<< HEAD
                            <div key={index} className="relative border rounded-lg overflow-hidden group w-40 h-40">
=======
                            <div key={index} className="relative border rounded-lg overflow-hidden group h-32">
>>>>>>> 59873b96c42cfe60dc7dfeab75aca9d342466692
                              <img
                                src={imageUrl || "/placeholder.svg?height=128&width=128"}
                                alt={`Product Image ${index + 1}`}
                                className={`w-full h-full object-cover ${imagesToDelete.includes(index) ? "opacity-30" : ""}`}
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement
                                  target.src = "/placeholder.svg?height=128&width=128"
                                  target.onerror = null
                                }}
                              />
                              <div className="absolute inset-0 flex items-center justify-center bg-opacity-0 group-hover:bg-opacity-30 transition-all">
                                <Button
                                  type="button"
                                  onClick={() => toggleImageForDeletion(index)}
                                  variant="ghost"
                                  size="sm"
                                  className={`${
                                    imagesToDelete.includes(index)
                                      ? "bg-red-600 text-white hover:bg-red-700"
                                      : "bg-white text-red-600 hover:bg-red-50"
                                  } rounded-full p-1`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                              {index === 0 && !imagesToDelete.includes(0) && (
                                <div className="absolute bottom-0 left-0 right-0 bg-green-700 text-white text-xs py-1 text-center">
                                  Main Image
                                </div>
                              )}
                              {imagesToDelete.includes(index) && (
                                <div className="absolute bottom-0 left-0 right-0 bg-red-600 text-white text-xs py-1 text-center">
                                  Marked for deletion
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="border rounded-lg h-32 flex items-center justify-center bg-gray-50">
                          <span className="text-gray-400 text-sm">No current images</span>
                        </div>
                      )}
                    </div>

                    <div className="grid gap-2">
                      <div className="flex justify-between items-center">
                        <label className="text-sm font-medium">Add New Images</label>
                        {newImagePreviews.length > 0 && (
                          <Button
                            type="button"
                            onClick={clearAllNewImages}
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:bg-red-50"
                          >
                            Clear All New
                          </Button>
                        )}
                      </div>
                      <div className="border-2 border-dashed rounded-lg p-4 transition-colors border-gray-200 hover:border-green-700 hover:bg-green-50">
                        <label htmlFor="image-upload" className="flex flex-col items-center gap-2 cursor-pointer">
                          <Upload className="h-8 w-8 text-gray-400" />
                          <span className="text-sm text-gray-500">Click to upload multiple images</span>
                          <span className="text-xs text-gray-400">PNG, JPG up to 10MB</span>
                          <input
                            id="image-upload"
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            multiple
                            className="sr-only"
                          />
                        </label>
                      </div>

                      {newImagePreviews.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                          {newImagePreviews.map((preview, index) => (
<<<<<<< HEAD
                            <div key={`new-${index}`} className="relative border rounded-lg overflow-hidden w-40 h-40">
=======
                            <div key={`new-${index}`} className="relative border rounded-lg overflow-hidden h-32">
>>>>>>> 59873b96c42cfe60dc7dfeab75aca9d342466692
                              <img
                                src={preview || "/placeholder.svg?height=128&width=128"}
                                alt={`New image ${index + 1}`}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement
                                  target.src = "/placeholder.svg?height=128&width=128"
                                  target.onerror = null
                                }}
                              />
                              <Button
                                type="button"
                                onClick={() => removeNewImage(index)}
                                className="absolute top-2 right-2 h-6 w-6 bg-red-100 text-red-600 rounded-full p-1 hover:bg-red-200"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                              {selectedProductImages.length === 0 && index === 0 && (
                                <div className="absolute bottom-0 left-0 right-0 bg-green-700 text-white text-xs py-1 text-center">
                                  Will be Main Image
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="border rounded-lg h-16 flex items-center justify-center bg-gray-50">
                          <span className="text-gray-400 text-xs">No new images added</span>
                        </div>
                      )}
                    </div>
<<<<<<< HEAD
=======

                    <div className="grid grid-cols-4 items-center gap-4">
                      <label htmlFor="imageUrl" className="text-right text-sm font-medium">
                        Main Image URL
                      </label>
                      <Input
                        id="imageUrl"
                        name="imageUrl"
                        value={editForm?.imageUrl || ""}
                        onChange={handleInputChange}
                        className="col-span-3"
                      />
                      <p className="text-xs text-gray-500 col-span-3 col-start-2">
                        This will be overridden if you upload new images or change the order
                      </p>
                    </div>
>>>>>>> 59873b96c42cfe60dc7dfeab75aca9d342466692
                  </div>
                </TabsContent>
              </div>
            </Tabs>

            <DialogFooter className="pt-4 border-t mt-2">
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveEdit} className="bg-green-700 text-white hover:bg-green-800">
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

<<<<<<< HEAD
      {selectedProduct && (
        <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
          <DialogContent className="sm:max-w-2xl md:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader className="pb-2">
              <DialogTitle>
                <p className="text-xl text-gray-700">{selectedProduct.productName}</p>
                <p className="text-sm font-medium">{selectedProduct.description}</p>
                </DialogTitle>
            </DialogHeader>
              <div className="">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center gap-3 p-4 bg-white rounded-lg shadow-sm">
                    <Tag className="text-green-700 w-5 h-5" />
                    <div>
                      <p className="text-sm text-gray-500">Category</p>
                      <p className="font-medium">{selectedProduct.category}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-white rounded-lg shadow-sm">
                    <Package className="text-green-700 w-5 h-5" />
                    <div>
                      <p className="text-sm text-gray-500">Buckle Number</p>
                      <p className="font-medium">{selectedProduct.buckleNumber}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-white rounded-lg shadow-sm">
                    <Layers className="text-green-700 w-5 h-5" />
                    <div>
                      <p className="text-sm text-gray-500">Quantity</p>
                      <p className="font-medium">{selectedProduct.quantity}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-white rounded-lg shadow-sm">
                    <IndianRupee className="text-green-700 w-5 h-5" />
                    <div>
                      <p className=" text-gray-500">Price</p>
                      <div className="font-medium"> 
                        <span className=" text-gray-900">₹{selectedProduct.discountedPrice}</span>
                          {selectedProduct.price > selectedProduct.discountedPrice && (
                            <span className="text-gray-500 line-through ml-1">₹{selectedProduct.price}</span>
                          )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-white rounded-lg shadow-sm">
                    <Calendar className="text-green-700 w-5 h-5" />
                    <div>
                      <p className="text-sm text-gray-500">Manufactured At</p>
                      <p className="font-medium">{selectedProduct.manufacturedAt}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-4 bg-white rounded-lg shadow-sm">
                    <CalendarX2 className="text-green-700 w-5 h-5" />
                    <div>
                      <p className="text-sm text-gray-500">Expires At</p>
                      <p className="font-medium">{selectedProduct.expiresAt}</p>
                    </div>
                  </div>
              </div>
            </div>
          </DialogContent>
          </Dialog>
      )}
      <AlertDialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the product "{selectedProduct?.productName}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteModalOpen(false)} >Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 text-white hover:bg-red-700">Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
=======
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
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleDeleteConfirm} className="bg-red-600 text-white hover:bg-red-700">
              Delete Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
>>>>>>> 59873b96c42cfe60dc7dfeab75aca9d342466692
    </>
  )
}

export default EditProduct;
