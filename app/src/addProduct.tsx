'use client';

import { useState, useEffect } from 'react';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { db } from '@/app/src/firebase';
import { Input } from '@/components/ui/input';
import { Select } from '@radix-ui/react-select';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import { format } from "date-fns"
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { toast, Toaster } from 'sonner';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
 
type Category = {
  id: string;
  name: string;
};

const formSchema = z.object({
  productName: z.string().min(1, 'Product name is required'),
  description: z.string().min(1, 'Description is required'),
  price: z.string().min(1, 'Price is required'),
  discountedPrice: z.string().min(1, 'Discounted price is required'),
  buckleNumber: z.string()
    .length(6, 'Buckle number must be exactly 6 digits'),
  quantity: z.string().min(1, 'Quantity is required'),
  categoryId: z.string().min(1, 'Category is required'),
  image: z.instanceof(File, { message: 'Image is required and must be a file' }),
  manufacturedAt: z.string().min(1, 'Manufactured date is required'),
  expiresAt: z.string().min(1, 'Expires date is required'),
});

const AddProductForm = () => {
  const [categories, setCategories] = useState<Category[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      productName: '',
      description: '',
      price: '',
      discountedPrice: '',
      buckleNumber: '',
      quantity: '',
      categoryId: '',
      manufacturedAt: '',
      expiresAt: '',
      image: undefined as unknown as File,
    },
  });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'categories'));
        const categoryList: Category[] = snapshot.docs
        .map(doc => ({
          id: doc.id,
          name: doc.data().name,
        })
      )
        .sort((a, b) => a.name.localeCompare(b.name));
        setCategories(categoryList);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, []);
  

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };

  const onSubmit = async (data: any) => {
    try {
      let imageUrl = '';

      if (data.image) {
        if (data.image instanceof File) { 
          const base64Image = await convertToBase64(data.image);
          imageUrl = base64Image;
        } else {
          throw new Error('Image is not a valid file');
        }
      }

      const selectedCategory = categories.find(cat => cat.id === data.categoryId);
      const categoryName = selectedCategory ? selectedCategory.name : '';

      await addDoc(collection(db, 'products'), {
        productName: data.productName,
        description: data.description,
        price: data.price,
        discountedPrice: data.discountedPrice,
        buckleNumber: data.buckleNumber,
        quantity: data.quantity,
        category: categoryName,
        imageUrl,
        manufacturedAt: data.manufacturedAt,
        expiresAt: data.expiresAt,
      });

      toast.success('Product added successfully');

      reset();
    } catch (error) {
      console.error('Error adding product:', error);
      toast.error('Failed to add product');
    }
  };


  return (
    <>
    <Toaster />
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Add Product</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 gap-6">

        {/* Product Name */}
        <div>
          <Input {...register('productName')} placeholder="Product Name*" />
            {errors.productName && (
              <p className="text-red-500 text-sm">{errors.productName.message}</p>
            )}
        </div>

        {/* Product Categories Select */}
        <div>
          <select {...register('categoryId')} className="w-full border p-2 rounded">
            <option value="">Select Category*</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
            {errors.categoryId && (
              <p className="text-red-500 text-sm">{errors.categoryId.message}</p>
            )}
        </div>

        {/* Product Description */}
        <div>
          <Input {...register('description')} placeholder="Description*" />
            {errors.description && (
              <p className="text-red-500 text-sm">{errors.description.message}</p>
            )}
        </div>

        {/* Product Image Upload */}
        <div>
          <Input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                setValue('image', file);
              }
            }}
            
          />
            {errors.image && (
              <p className="text-red-500 text-sm">{errors.image.message}</p>
            )}
        </div>


        {/* Product Price */}
        <div>
          <Input {...register('price')} type="number" placeholder="Price*" min="0"/>
            {errors.price && (
              <p className="text-red-500 text-sm">{errors.price.message}</p>
            )}
        </div>

        {/* Product Discounted Price */}
        <div>
          <Input {...register('discountedPrice')} type="number" placeholder="Discounted Price*" min="0"/>
            {errors.discountedPrice && (
              <p className="text-red-500 text-sm">{errors.discountedPrice.message}</p>
            )}
        </div>

        {/* Product Manufactured Date */}
        <div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {watch('manufacturedAt') || 'Manufactured Date*'}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start">
              <Calendar
                mode="single"
                selected={watch('manufacturedAt') ? new Date(watch('manufacturedAt')) : undefined}
                onSelect={(date) =>
                  setValue('manufacturedAt', date ? format(date, 'yyyy-MM-dd') : '')
                }
              />
            </PopoverContent>
          </Popover>
          {errors.manufacturedAt && (
            <p className="text-red-500 text-sm">{errors.manufacturedAt.message}</p>
          )}
        </div>

        {/* Product Buckle Number */}
        <div>
          <Input {...register('buckleNumber')} type="number" placeholder="Buckle Number*" min="0" maxLength={6} minLength={6} />
            {errors.buckleNumber && (
              <p className="text-red-500 text-sm">{errors.buckleNumber.message}</p>
            )}
        </div>
       
        {/* Product Expires Date */}
        <div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className='w-full justify-start'>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {watch('expiresAt') || 'Expires Date*'}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start">
              <Calendar
                mode="single"
                selected={watch('expiresAt') ? new Date(watch('expiresAt')) : undefined}
                onSelect={(date) =>
                  setValue('expiresAt', date ? format(date, 'yyyy-MM-dd') : '')
                }
              />
            </PopoverContent>
          </Popover>
          {errors.expiresAt && (
            <p className="text-red-500 text-sm">{errors.expiresAt.message}</p>
            )}
          </div>

        {/* Product Quantity */}
        <div>
          <Input {...register('quantity')} type="number" placeholder="Quantity*" min="0"/>
            {errors.quantity && (
              <p className="text-red-500 text-sm">{errors.quantity.message}</p>
            )}
        </div>

        <div className="col-span-2">
          <Button type="submit" className="w-full bg-green-700 text-white py-2 rounded-md hover:bg-green-800">
            Submit
          </Button>
        </div>
      </form>
    </div>
    </>
  );
};

export default AddProductForm;