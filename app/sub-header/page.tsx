'use client';

import React, { useEffect, useRef, useState } from 'react';
import { collection, getDocs, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../src/firebase';
import { useRouter } from 'next/navigation';

const SubHeader = () => {
  const [categories, setCategories] = useState<string[]>([]);
  const [showMore, setShowMore] = useState(false);
  const [visibleCount, setVisibleCount] = useState(7);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const router = useRouter();
  // const [sortedCategories, setSortedCategories] = useState(categories);

  useEffect(() => {
    const collectionRef = collection(db, 'categories');
    const q = query(collectionRef, orderBy('order'));
  
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const categoryList = querySnapshot.docs.map((doc) => doc.data().name)
      // .sort((a, b) => a.order - b.order)
      setCategories(categoryList);
    });
    return () => unsubscribe();
  }, []);

  const handleCategoryClick = (category: string) => {
    const formattedCategoryName = category.replace(/\s+/g, '-');
    router.push(`/categories/${formattedCategoryName}`);
    setShowMore(false);
  };

  // Handle screen size change
  useEffect(() => {
    const updateVisibleCount = () => {
      if (window.innerWidth >= 1300) {
        setVisibleCount(7);
      } else if (window.innerWidth >= 1100) {
        setVisibleCount(6);
      } else if (window.innerWidth >= 850) {
        setVisibleCount(5);
      } else if (window.innerWidth >= 680) {
        setVisibleCount(4);
      } else if (window.innerWidth >= 500) {
        setVisibleCount(3);
      } else {
        setVisibleCount(2);
      }
    };

    updateVisibleCount();
    window.addEventListener('resize', updateVisibleCount);

    return () => {
      window.removeEventListener('resize', updateVisibleCount);
    };
  }, []);

  // useEffect(() => {
  //   const handleResize = () => {
  //     if (window.innerWidth < 400) {
  //       setSortedCategories([...categories].sort((a, b) => a.length - b.length));
  //     } else {
  //       setSortedCategories(categories);
  //     }
  //   };
  
  //   handleResize();
  //   window.addEventListener("resize", handleResize);
  
  //   return () => window.removeEventListener("resize", handleResize);
  // }, [categories]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setShowMore(false);
      }
    };

    if (showMore) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMore]);
 
  return (
    <div className="xl:pl-48 lg:pl-36 md:pl-24 sm:pl-16 pl-7 shadow-md overflow-visible text-gray-600">
      <div className="flex gap-2 text-sm scroll-smooth snap-x">
        {categories.slice(0, visibleCount).map((category) => (
          <button
            key={category}
            className="px-4 bg-white hover:bg-gray-100 text-sm font-medium snap-start transition duration-200 ease-in-out"
            onClick={() => handleCategoryClick(category)}
          >
            {category}
          </button>
        ))} 
        {categories.length > visibleCount && (
          <div className="relative">
            <button
              ref={buttonRef}
              onClick={() => setShowMore((prev) => !prev)}
              className="px-4 py-3 bg-white hover:bg-gray-100 flex items-center justify-between gap-1"
            >
              More
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            {showMore && (
              <div
                ref={menuRef}
                className="absolute max-h-[300px] bg-white shadow-lg overflow-y-auto right-0 top-full 
                w-44 z-50"
              >
                {categories.slice(visibleCount).map((category) => (
                  <button
                    key={category}
                    className="block h-[50px] px-4 py-2 w-full text-left hover:bg-gray-100 border-b"
                    onClick={() => handleCategoryClick(category)}
                  >
                    {category}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SubHeader;