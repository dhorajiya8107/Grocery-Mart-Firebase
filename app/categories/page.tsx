'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Input } from '@/components/ui/input';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { Search } from 'lucide-react';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { db } from '../src/firebase';

interface Category {
  name: string;
  order: number;
  imageUrl: string;
}

const Categories = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);

  // Fetching all categories in order
  useEffect(() => {
    const collectionRef = collection(db, 'categories');
    const q = query(collectionRef, orderBy('order'));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const categoryList = querySnapshot.docs.map((doc) => ({
        name: doc.data().name,
        order: doc.data().order || 0,
        imageUrl: doc.data().imageUrl
      }));
      setCategories(categoryList);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  // Filtered products by searching
  const filteredCategories = categories.filter(
    (category) =>
      category.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );
 
  return (
    <>
      <div className='flex flex-col bg-gradient-to-b from-gray-50 to-gray-100 min-h-screen'>
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h1 className="text-2xl font-bold text-gray-800 capitalize">Product Categories</h1>
              <div className="flex items-center gap-3">
                {/* Search Bar */}
                <div className="relative flex-grow max-w-md">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <Input
                    type="text"
                    placeholder="Search category name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white border border-gray-200 pl-10 py-2 rounded-lg focus:outline-none transition"
                  />
                </div>
              </div>
           </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
            {filteredCategories.map((category, index) => (
              <div className='pt-2' key={index} onClick={() => router.push(`/categories/${category.name.replace(/\s+/g, '-')}`)}>
                <div className="bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 relative cursor-pointer hover:shadow-lg h-64">
                  <div className='w-full h-full flex flex-col'>
                    <div className="flex items-center justify-center pt-4 pb-2 px-2 h-3/4">
                      <img
                        src={category.imageUrl}
                        alt={category.imageUrl}
                        className="w-32 h-32 object-contain"
                      />
                    </div>
                    <div className="px-3 pb-4 text-center h-1/4">
                      <h2 className="text-sm md:text-base font-semibold text-gray-800 break-words">
                        {category.name}
                      </h2>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {filteredCategories.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="text-xl font-medium text-gray-700 mb-2">No category found</div>
              <p className="text-gray-500">We couldn't find any category matching "{searchTerm}"</p>
          </div>
          )}
          {loading && (
            <p className="text-gray-500 py-6 text-xl text-center">
              Loading categories...
            </p>
          )}
        </div>
      </div>
    </>
  );
};

export default Categories;