'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { yupResolver } from '@hookform/resolvers/yup';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, updateDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast, Toaster } from 'sonner';
import * as yup from 'yup';
import { auth, db } from '../src/firebase';
import { CustomPagination } from '@/components/CustomPagination';
import { Search } from 'lucide-react';
 
interface Category {
  id: string;
  name: string;
  order: number;
}

const schema = yup.object().shape({
  name: yup.string()
    .required('Category name is required')
    .min(3, 'Category name must be at least 3 characters'),
});

const AddCategories = () => {
  const [role, setRole] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [mode, setMode] = useState('add');
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const { register, handleSubmit, reset, setValue, formState: { errors }, } = useForm<{ name: string }>({
    resolver: yupResolver(schema),
    defaultValues: {
      name: editCategory?.name || '',
    },
  });

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

  // Fetch categories data form firestore
  useEffect(() => {
    const fetchCategories = async () => {
      if (!userId) return;

      try {
        const collectionRef = collection(db, 'categories');
        const querySnapshot = await getDocs(collectionRef);

        const fetchedCategories = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name,
          order: doc.data().order,
        }));

        setCategories(fetchedCategories.sort((a, b) => a.order - b.order));
      } catch (error) {
        console.error('Error fetching categories: ', error);
      }
    };

    fetchCategories();
  }, [userId]);

  const filteredCategories = categories.filter(
    (categories) =>
      categories.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      categories.order?.toString().toLowerCase().includes(searchTerm.toLowerCase())
  );

  // useEffect(() => {
  //   if (mode === 'edit' && editCategory?.name) {
  //     setValue('name', editCategory.name);
  //   } else {
  //     setValue('name', newCategory);
  //   }
  // }, [mode, editCategory, newCategory, setValue]);

  // Handle add new category
  const handleAddCategory = async (data: { name: string }) => {
    const isDuplicate = categories.some(
      (cat) => cat.name.toLowerCase() === data.name.toLowerCase()
    );

    if (isDuplicate) {
      toast.info(`Category "${data.name}" already exists!`)
      return;
    }

    try {
      const collectionRef = collection(db, 'categories');
      const order = categories.length + 1;

      const newDoc = await addDoc(collectionRef, {
        name: data.name,
        order,
      });

      setCategories([...categories, { id: newDoc.id, name: data.name, order }]);
      setNewCategory('');
      setOpenDialog(false);
      reset();
      console.log(`Added category: ${data.name}`);
      toast.success(`Category "${data.name}" added successfully!`);
    } catch (error) {
      console.error('Error adding category:', error);
    }
  };

  // Handle delete category
  const handleDeleteCategory = async (id: string) => {
    try {
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
      console.log(`Deleted category and updated order`);
      toast.info(`Deleted category name ${categoryName}`)
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  // For opening add dialog
  const openAddDialog = () => {
    setMode('add');
    setNewCategory('');
    reset({ name: newCategory });
    setOpenDialog(true);
  };

  // For opening edit dialog
  const openEditDialog = (category: Category) => {
    setMode('edit');
    reset({ name: category.name });
    setOpenDialog(true);
    setEditCategory(category);
  };

  // Handle edit category name
  const handleEditCategory = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditCategory((prev) => (prev ? { ...prev, name: e.target.value } : null));
  };

  // Handle update category
  const handleUpdateCategory = async (data: { name: string }) => {
    if (!editCategory) return;

    const isDuplicate = categories.some(
      (cat) =>
        cat.name.toLowerCase() === data.name.toLowerCase() &&
        cat.id !== editCategory.id
    );

    if (isDuplicate) {
      toast.info(`Category "${data.name}" already exists!`);
      return;
    }

    try {
      const collectionRef = collection(db, 'categories');
      const docRef = doc(collectionRef, editCategory.id);

      await updateDoc(docRef, { name: data.name });

      setCategories(
        categories.map((cat) =>
          cat.id === editCategory.id ? { ...cat, name: data.name } : cat
        )
      );
      setOpenDialog(false);
      reset();
      toast.success(`Updated category: ${data.name}`);
    } catch (error) {
      console.error('Error updating category:', error);
    }
  };

  const indexOfLastCategory = currentPage * itemsPerPage;
  const indexOfFirstCategory = indexOfLastCategory - itemsPerPage;
  const currentCategories = filteredCategories.slice(indexOfFirstCategory, indexOfLastCategory);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);
  // const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  // for (let i = 1; i <= Math.ceil(filteredCategories.length / itemsPerPage); i++) {
  //   pageNumbers.push(i);
  // }

  const handleNext = () => {
    if (currentPage < Math.ceil(filteredCategories.length / itemsPerPage)) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevious = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleFirst = () => {
    setCurrentPage(1);
  };

  const handleLast = () => {
    setCurrentPage(Math.ceil(filteredCategories.length / itemsPerPage));
  };

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
                reset();
                setNewCategory('');
              }
            }}>
              <div className="flex items-center justify-between">
                <p className="text-lg font-bold">Manage Categories</p>
                <DialogTrigger asChild>
                  <Button
                    className="text-white bg-green-700 hover:bg-green-700 px-6 text-md border cursor-pointer"
                    onClick={() => {
                      openAddDialog();
                    }}
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
                  onSubmit={handleSubmit(
                    mode === 'add' ? handleAddCategory : handleUpdateCategory
                  )}
                  className="space-y-4"
                >
                  <Input
                    type="text"
                    {...register('name')}
                    className={`border ${errors.name ? 'border-red-500' : 'border-gray-300'
                      }`}
                    onChange={(e) => {
                      setError('');
                      // if (mode === 'add') {
                      //   setNewCategory(e.target.value);
                      // } else {
                      //   setNewCategory(e.target.value)
                      // }
                      { mode === 'add' ? setNewCategory(e.target.value) : handleEditCategory(e)}
                    }}
                    placeholder="Category name"
                    required
                  />
                  {errors.name && (
                    <span className="text-red-500 text-sm">
                      {errors.name.message}
                    </span>
                  )}

                  <div className="flex justify-end items-center gap-2">
                    <DialogClose asChild>
                      <Button className="bg-gray-300 text-gray-800 hover:bg-gray-300 cursor-pointer">
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
              placeholder="Search by categories name..."
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
                <div>
                  <span className=''>
                    {category.order}. {category.name}
                  </span>
                </div>
                <div className="gap-2 justify-between flex">

                  <Button
                    className="text-blue-500 bg-blue-100 hover:bg-blue-100 border-blue-500 border cursor-pointer"
                    onClick={() => {
                      openEditDialog(category);
                    }}
                  >
                    Edit
                  </Button>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        className="text-red-500 bg-red-100 hover:bg-red-100 border-red-500 border cursor-pointer"
                      >
                        Delete
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogTitle className="text-lg font-semibold">Confirm Deletion</DialogTitle>
                      <p>Are you sure you want to delete this category?</p>
                      <div className="flex justify-end gap-2 mt-4">
                        <DialogClose asChild>
                          <Button className="bg-gray-300 text-gray-800 hover:bg-gray-300 cursor-pointer">
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