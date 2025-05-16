'use client';

import { CustomPagination } from '@/components/CustomPagination';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, updateDoc } from 'firebase/firestore';
import { Edit, Search, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast, Toaster } from 'sonner';
import { auth, db } from '../src/firebase';
 
interface Category {
  id: string;
  name: string;
  order: number;
  imageUrl: string;
}

const AddCategories = () => {
  const [role, setRole] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [mode, setMode] = useState('add');
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();
  const [errors, setErrors] = useState<{name?: string, imageUrl?: string}>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [categoryName, setCategoryName] = useState('');
  
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

  // If user is login then set userId otherwise null
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getAuth(), (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId(null);
        if (!auth.currentUser) {
          router.replace('/');
          return;
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Fetch categories data from firestore
  useEffect(() => {
    const fetchCategories = async () => {
      if (!userId) return;

      try {
        const collectionRef = collection(db, 'categories');
        const querySnapshot = await getDocs(collectionRef);

        const fetchedCategories = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name,
          order: doc.data().order || 0,
          imageUrl: doc.data().imageUrl || ''
        }));

        setCategories(fetchedCategories.sort((a, b) => a.order - b.order));
      } catch (error) {
        console.error('Error fetching categories: ', error);
        toast.error('Failed to fetch categories');
      }
    };

    fetchCategories();
  }, [userId]);

  const filteredCategories = categories.filter(
    (category) =>
      category.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.order?.toString().toLowerCase().includes(searchTerm.toLowerCase())
  );

  const validateForm = (name: string) => {
    const newErrors: {name?: string, imageUrl?: string} = {};
    
    if (!name || name.trim().length < 3) {
      newErrors.name = 'Category name must be at least 3 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

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
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      
      setSelectedImage(file);
      
      // Create preview for the selected image
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle add new category
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm(categoryName)) {
      return;
    }

    const isDuplicate = categories.some(
      (cat) => cat.name.toLowerCase() === categoryName.toLowerCase()
    );

    if (isDuplicate) {
      toast.error(`Category "${categoryName}" already exists!`);
      return;
    }

    try {
      // toast.loading('Adding category...', {
      //   style: { color: "green"}
      // });
      const collectionRef = collection(db, 'categories');
      const order = categories.length + 1;

      let imageUrl = '';
      if (selectedImage) {
        try {
          imageUrl = await convertToBase64(selectedImage);
        } catch (error) {
          console.error('Error processing image:', error);
          toast.dismiss();
          toast.error('Failed to process image. Please try a different image.');
          return;
        }
      }

      const newDoc = await addDoc(collectionRef, {
        name: categoryName.trim(),
        order,
        imageUrl: imageUrl,
      });

      setCategories([...categories, { id: newDoc.id, name: categoryName.trim(), order, imageUrl }]);
      setNewCategory('');
      setCategoryName('');
      setSelectedImage(null);
      setImagePreview(null);
      setOpenDialog(false);
      
      toast.dismiss();
      toast.success(`Category "${categoryName}" added successfully!`, {
        style: { color: "green" }
      });
    } catch (error) {
      console.error('Error adding category:', error);
      toast.dismiss();
      toast.error('Failed to add category. Please try again.');
    }
  };

  // Handle delete category
  const handleDeleteCategory = async (id: string) => {
    try {
      // toast.loading('Deleting category...',{
      //   style: { color: "green"}
      // });
      const collectionRef = collection(db, 'categories');
      const categoryName = categories.find((cat) => cat.id === id)?.name;
      await deleteDoc(doc(collectionRef, id));

      const updatedCategories = categories
        .filter((cat) => cat.id !== id)
        .map((cat, index) => ({
          ...cat,
          order: index + 1,
        }));

      for (const cat of updatedCategories) {
        const docRef = doc(collectionRef, cat.id);
        await updateDoc(docRef, { order: cat.order });
      }

      setCategories(updatedCategories);
      toast.dismiss();
      toast.success(`Category "${categoryName}" deleted successfully!`, {
        style: { color: "red"}
      });
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.dismiss();
      toast.error('Failed to delete category. Please try again.');
    }
  };

  // For opening add dialog
  const openAddDialog = () => {
    setMode('add');
    setNewCategory('');
    setCategoryName('');
    setSelectedImage(null);
    setImagePreview(null);
    setErrors({});
    setOpenDialog(true);
  };

  // For opening edit dialog
  const openEditDialog = (category: Category) => {
    setMode('edit');
    setEditCategory(category);
    setCategoryName(category.name);
    setImagePreview(category.imageUrl);
    setErrors({});
    setOpenDialog(true);
  };

  // Handle update category
  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editCategory) return;
    
    if (!validateForm(categoryName)) {
      return;
    }

    const isDuplicate = categories.some(
      (cat) =>
        cat.name.toLowerCase() === categoryName.toLowerCase() &&
        cat.id !== editCategory.id
    );

    if (isDuplicate) {
      toast.error(`Category "${categoryName}" already exists!`);
      return;
    }

    try {
      // toast.loading('Updating category...', {
      //   style: { color: "green" }
      // });
      const collectionRef = collection(db, 'categories');
      const docRef = doc(collectionRef, editCategory.id);

      let updatedImageUrl = editCategory.imageUrl;
      if (selectedImage) {
        try {
          updatedImageUrl = await convertToBase64(selectedImage);
        } catch (error) {
          console.error('Error processing image:', error);
          toast.dismiss();
          toast.error('Failed to process image. Please try a different image.');
          return;
        }
      }

      await updateDoc(docRef, { 
        name: categoryName.trim(), 
        imageUrl: updatedImageUrl 
      });

      setCategories(
        categories.map((cat) =>
          cat.id === editCategory.id ? { ...cat, name: categoryName.trim(), imageUrl: updatedImageUrl } : cat
        )
      );
      
      setOpenDialog(false);
      setSelectedImage(null);
      setImagePreview(null);
      toast.dismiss();
      toast.success(`Category "${categoryName}" updated successfully!`, {
        style: { color: "green"}
      });
    } catch (error) {
      console.error('Error updating category:', error);
      toast.dismiss();
      toast.error('Failed to update category. Please try again.');
    }
  };
  
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const indexOfLastCategory = currentPage * itemsPerPage;
  const indexOfFirstCategory = indexOfLastCategory - itemsPerPage;
  const currentCategories = filteredCategories.slice(indexOfFirstCategory, indexOfLastCategory);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-16 w-16 border-4 border-gray-300 border-t-green-700 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!userId) {
    return <div>Please log in to add categories.</div>;
  }
  
  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);

  return (
    <>
      <Toaster />
      <div className='pt-10 pb-20 bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-8'>
        <div className="p-8 max-w-[900px] bg-white mx-auto shadow-lg">
          <div className="gap-2 mb-4">
            <Dialog open={openDialog} onOpenChange={(isOpen) => {
              setOpenDialog(isOpen);
              if (!isOpen) {
                setCategoryName('');
                setNewCategory('');
                setSelectedImage(null);
                setImagePreview(null);
                setErrors({});
              }
            }}>
              <div className="flex items-center justify-between">
                <p className="text-lg font-bold">Manage Categories</p>
                <DialogTrigger asChild>
                  <Button
                    className="text-white bg-green-700 hover:bg-green-700 px-6 text-md border cursor-pointer"
                    onClick={openAddDialog}
                  >
                    Add
                  </Button>
                </DialogTrigger>
              </div>

              <DialogContent>
                <DialogTitle className="text-lg font-semibold">
                  {mode === 'add' ? "Add New Category" : "Edit Category"}
                </DialogTitle>
                <form
                  onSubmit={mode === 'add' ? handleAddCategory : handleUpdateCategory}
                  className="space-y-4"
                >
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">Category Name</label>
                    <Input
                      id="name"
                      type="text"
                      value={categoryName}
                      className={`mt-1 border ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                      onChange={(e) => {
                        setCategoryName(e.target.value);
                        if (mode === 'add') {
                          setNewCategory(e.target.value);
                        }
                      }}
                      placeholder="Enter category name"
                      required
                    />
                    {errors.name && (
                      <span className="text-red-500 text-sm">{errors.name}</span>
                    )}
                  </div>

                  <div>
                    <label htmlFor="image" className="block text-sm font-medium text-gray-700">Category Image</label>
                    <Input
                      id="image"
                      type="file"
                      accept="image/*"
                      className="mt-1 border border-gray-300"
                      onChange={handleImageUpload}
                    />
                    {/* <p className="text-xs text-gray-500 mt-1">Max file size: 5MB</p> */}
                  </div>

                  {imagePreview && (
                    <div className="mt-2">
                      <p className="text-sm font-medium text-gray-700 mb-1">Image Preview:</p>
                      <img 
                        src={imagePreview} 
                        alt="Category preview" 
                        className="w-24 h-24 object-cover border border-gray-300 rounded-md"
                      />
                    </div>
                  )}

                  <div className="flex justify-end items-center gap-2">
                    <DialogClose asChild>
                      <Button type="button" className="bg-gray-300 text-gray-800 hover:bg-gray-300 cursor-pointer">
                        Cancel
                      </Button>
                    </DialogClose>
                    <Button
                      type="submit"
                      className="bg-green-700 text-white hover:bg-green-700 cursor-pointer px-6 py-2"
                    >
                      {mode === 'add' ? 'Add' : 'Save'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Search Bar */}
          <div className="relative mb-6">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <Input
              type="text"
              placeholder="Search by category name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border pl-10 border-gray-300 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition"
            />
          </div>

          <ul className="space-y-2 text-sm">
            {currentCategories.map((category) => (
              <li
                key={category.id}
                className="items-center justify-between flex border-t border-gray-200 py-4"
              >
                <div className="flex items-center">
                  {category.imageUrl ? (
                    <img 
                      src={category.imageUrl} 
                      alt={category.name}
                      className="w-10 h-10 object-cover rounded-md mr-3" 
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gray-200 rounded-md mr-3 flex items-center justify-center">
                      <span className="text-gray-500 text-xs">No img</span>
                    </div>
                  )}
                  <span>
                    {category.order}. {category.name}
                  </span>
                </div>
                <div className="gap-2 justify-between flex">
                  <Button
                    className="text-blue-500 bg-blue-100 hover:bg-blue-100 border-blue-500 border cursor-pointer"
                    onClick={() => openEditDialog(category)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        className="text-red-500 bg-red-100 hover:bg-red-100 border-red-500 border cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogTitle className="text-lg font-semibold">Confirm Deletion</DialogTitle>
                      <p>Are you sure you want to delete this category?</p>
                      <div className="flex justify-end gap-2 mt-4">
                        <DialogClose asChild>
                          <Button type="button" className="bg-gray-300 text-gray-800 hover:bg-gray-300 cursor-pointer">
                            Cancel
                          </Button>
                        </DialogClose>
                        <Button
                          onClick={() => handleDeleteCategory(category.id)}
                          className="bg-red-500 text-white hover:bg-red-500 cursor-pointer px-4"
                        >
                          Delete
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </li>
            ))}

            {filteredCategories.length === 0 && (
              <li className="text-gray-500 py-6 text-xl text-center">
                No categories found.
              </li>
            )}
          </ul>
          <p className='border-b'></p>

          {filteredCategories.length > 0 && (
            <CustomPagination
              totalCount={filteredCategories.length}
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
    </>
  );
};

export default AddCategories;