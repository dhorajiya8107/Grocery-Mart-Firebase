'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { StaticImageData } from 'next/image';
import Cat1 from '../../images/Home/Cat1.png';
import Cat2 from '../../images/Home/Cat2.png';
import Cat3 from '../../images/Home/Cat3.png';
import Cat4 from '../../images/Home/Cat4.png';
import Cat5 from '../../images/Home/Cat5.png';
import Cat6 from '../../images/Home/Cat6.png';
import Cat7 from '../../images/Home/Cat7.png';
import Cat8 from '../../images/Home/Cat8.png';
import Cat9 from '../../images/Home/Cat9.png';
import Cat10 from '../../images/Home/Cat10.png';
import Cat11 from '../../images/Home/Cat11.png';
import Cat12 from '../../images/Home/Cat12.png';
import Cat13 from '../../images/Home/Cat13.png';
import Cat14 from '../../images/Home/Cat14.png';
import Cat15 from '../../images/Home/Cat15.png';
import Cat16 from '../../images/Home/Cat16.png';
import Cat17 from '../../images/Home/Cat17.png';
import Cat18 from '../../images/Home/Cat18.png';
import { useParams, useRouter } from 'next/navigation';

import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import { Input } from '@/components/ui/input';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../src/firebase';

interface Category {
  name: string;
  order: number;
}

const Categories = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const params = useParams();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);

  const categoryImages = {
    'Vegetables & Fruits': Cat1,
    'Dairy & Bread': Cat2,
    'Tea, Coffee & Health Drinks': Cat3,
    'Atta, Rice & Dal': Cat4,
    'Munchies': Cat5,
    'Sauces & Spreads': Cat6,
    'Body Care': Cat7,
    'Ice Creams & Frozen Desserts': Cat8,
    'Cold Drinks & Juices': Cat9,
    'Dry Fruits & Seeds Mix': Cat10,
    'Oils and Ghee': Cat11,
    'Cleaning Essentials': Cat12,
    'Home & Furnishing': Cat13,
    'Paan Corner': Cat14,
    'Baby Care': Cat15,
    'Cereals & Biscuits': Cat16,
    'Bakery': Cat17,
    'Toys & Stationary': Cat18,
    'default': Cat1,
  } as const;

  const getCategoryImage = (categoryName: string): StaticImageData => {
    return categoryImages[categoryName as keyof typeof categoryImages] || categoryImages['default'];
  };

  useEffect(() => {
    const collectionRef = collection(db, 'categories');
    const q = query(collectionRef, orderBy('order'));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const categoryList = querySnapshot.docs.map((doc) => ({
        name: doc.data().name,
        order: doc.data().order || 0,
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
          <h1 className="text-xl font-bold pl-10 mb-3 capitalize justify-start items-center flex bg-white w-full h-12">Product Categories</h1>
          {/* Search Bar */}
          <div className="relative mb-6">
            <Input
              type="text"
              placeholder="Search by category name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-gray-300 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 transition"
            />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
            {filteredCategories.map((category, index) => (
              <div className='pt-2' key={index} onClick={() => router.push(`/categories/${category.name}`)}>
                <div className="bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 relative cursor-pointer hover:shadow-lg h-64">
                  <div className='w-full h-full flex flex-col'>
                    <div className="flex items-center justify-center pt-4 pb-2 px-2 h-3/4">
                      <Image
                        src={getCategoryImage(category.name)}
                        alt={category.name}
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