"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { collection, addDoc, getDocs } from "firebase/firestore";
import { db } from "@/app/src/firebase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CalendarIcon, PackagePlus, Upload, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { toast, Toaster } from "sonner";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type Category = {
  id: string;
  name: string;
}

const formSchema = z
  .object({
    productName: z.string().min(1, "Product name is required"),
    description: z.string().min(1, "Description is required"),
    price: z.string().min(1, "Price is required"),
    discountedPrice: z.string().min(1, "Discounted price is required"),
    buckleNumber: z.string().length(6, "Buckle number must be exactly 6 digits"),
    quantity: z.string().min(1, "Quantity is required"),
    categoryId: z.string().min(1, "Category is required"),
    image: z.instanceof(File, { message: "Image is required and must be a PNG or JPG" }),
    manufacturedAt: z.string().min(1, "Manufactured date is required"),
    expiresAt: z.string().min(1, "Expires date is required"),
  })
  .refine(
    (data) => {
      const price = Number.parseFloat(data.price);
      const discounted = Number.parseFloat(data.discountedPrice);
      return discounted <= price;
    },
    {
      message: "Discounted price must be less than or equal to the original price.",
      path: ["discountedPrice"],
    },
  )
  .refine(
    (data) => {
      const manufacturedAt = new Date(data.manufacturedAt);
      const expiresAt = new Date(data.expiresAt);
      return manufacturedAt < expiresAt;
    },
    {
      message: "Expiry date must be after to manufactured date.",
      path: ["expiresAt"],
    },
  )

const AddProductForm = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [openMD, setOpenMD] = useState(false);
  const [openED, setOpenED] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
    reset,
    control,
  } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      productName: "",
      description: "",
      price: "",
      discountedPrice: "",
      buckleNumber: "",
      quantity: "",
      categoryId: "",
      manufacturedAt: "",
      expiresAt: "",
      image: undefined as unknown as File,
    },
  })

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const snapshot = await getDocs(collection(db, "categories"));
        const categoryList: Category[] = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            name: doc.data().name,
          }))
          .sort((a, b) => a.name.localeCompare(b.name));
        setCategories(categoryList);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    }

    fetchCategories()
  }, [])

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

  const onSubmit = async (data: any) => {
    try {
      let imageUrl = ""

      if (data.image) {
        if (data.image instanceof File) {
          const base64Image = await convertToBase64(data.image);
          imageUrl = base64Image;
        } else {
          throw new Error("Image is not a valid file");
        }
      }

      const selectedCategory = categories.find((cat) => cat.id === data.categoryId);
      const categoryName = selectedCategory ? selectedCategory.name : "";

      await addDoc(collection(db, "products"), {
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
      })

      toast.success("Product added successfully");
      setImagePreview(null);
      reset()
    } catch (error) {
      console.error("Error adding product:", error);
      toast.error("Failed to add product");
    }
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setValue("image", file);
      try {
        const base64 = await convertToBase64(file);
        setImagePreview(base64);
      } catch (error) {
        console.error("Error creating preview:", error);
      }
    }
  }

  const clearImagePreview = () => {
    setImagePreview(null);
    setValue("image", undefined as unknown as File);
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-CA").format(date);
  }

  return (
    <>
      <Toaster position="top-right" />
      <Card className="max-w-5xl mx-auto shadow-lg">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex text-2xl md:text-3xl font-bold items-center justify-center">
                <PackagePlus className="h-10 w-10 p-2 bg-green-50 rounded-full text-green-700 opacity-80 mr-2" />
                Add New Product
              </CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-700 border-b pb-2">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="productName" className="font-medium">
                    Product Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="productName"
                    {...register("productName")}
                    placeholder="Enter product name"
                    className="h-11"
                  />
                  {errors.productName && <p className="text-red-500 text-sm">{errors.productName.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category" className="font-medium">
                    Category <span className="text-red-500">*</span>
                  </Label>
                  <Controller
                    name="categoryId"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value} defaultValue="">
                        <SelectTrigger id="category" className="h-11">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.categoryId && <p className="text-red-500 text-sm">{errors.categoryId.message}</p>}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description" className="font-medium">
                    Description <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="description"
                    {...register("description")}
                    placeholder="Enter product description"
                    className="min-h-[100px] resize-none"
                  />
                  {errors.description && <p className="text-red-500 text-sm">{errors.description.message}</p>}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-700 border-b pb-2">Pricing & Inventory</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="price" className="font-medium">
                    Price (₹) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="price"
                    {...register("price")}
                    type="number"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="h-11"
                  />
                  {errors.price && <p className="text-red-500 text-sm">{errors.price.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discountedPrice" className="font-medium">
                    Discounted Price (₹) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="discountedPrice"
                    {...register("discountedPrice")}
                    type="number"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="h-11"
                  />
                  {errors.discountedPrice && <p className="text-red-500 text-sm">{errors.discountedPrice.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantity" className="font-medium">
                    Quantity <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="quantity"
                    {...register("quantity")}
                    type="number"
                    placeholder="0"
                    min="0"
                    className="h-11"
                  />
                  {errors.quantity && <p className="text-red-500 text-sm">{errors.quantity.message}</p>}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-700 border-b pb-2">Additional Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="buckleNumber" className="font-medium">
                    Buckle Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="buckleNumber"
                    {...register("buckleNumber")}
                    type="number"
                    placeholder="6-digit number"
                    className="h-11"
                  />
                  {errors.buckleNumber && <p className="text-red-500 text-sm">{errors.buckleNumber.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="manufacturedDate" className="font-medium">
                    Manufactured Date <span className="text-red-500">*</span>
                  </Label>
                  <Popover open={openMD} onOpenChange={setOpenMD}>
                    <PopoverTrigger asChild>
                      <Button
                        id="manufacturedDate"
                        variant="outline"
                        className="w-full justify-start h-11 text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {watch("manufacturedAt") || "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent align="start" className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={watch("manufacturedAt") ? new Date(watch("manufacturedAt")) : undefined}
                        onSelect={(date) => {
                          setValue("manufacturedAt", date ? formatDate(date) : "")
                          setOpenMD(false)
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                  {errors.manufacturedAt && <p className="text-red-500 text-sm">{errors.manufacturedAt.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expiryDate" className="font-medium">
                    Expiry Date <span className="text-red-500">*</span>
                  </Label>
                  <Popover open={openED} onOpenChange={setOpenED}>
                    <PopoverTrigger asChild>
                      <Button
                        id="expiryDate"
                        variant="outline"
                        className="w-full justify-start h-11 text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {watch("expiresAt") || "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent align="start" className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={watch("expiresAt") ? new Date(watch("expiresAt")) : undefined}
                        onSelect={(date) => {
                          setValue("expiresAt", date ? formatDate(date) : "")
                          setOpenED(false)
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                  {errors.expiresAt && <p className="text-red-500 text-sm">{errors.expiresAt.message}</p>}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-700 border-b pb-2">Product Image</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="image" className="font-medium">
                    Product Image <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        "border-2 border-dashed rounded-lg p-4 w-full transition-colors",
                        errors.image
                          ? "border-red-400 bg-red-50"
                          : "border-gray-200 hover:border-green-700 hover:bg-green-50",
                      )}
                    >
                      <label htmlFor="image-upload" className="flex flex-col items-center gap-2 cursor-pointer">
                        <Upload className="h-8 w-8 text-gray-400" />
                        <span className="text-sm text-gray-500">Click to upload</span>
                        <span className="text-xs text-gray-400">PNG, JPG up to 10MB</span>
                        <input
                          id="image-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="sr-only"
                        />
                      </label>
                    </div>
                  </div>
                  {errors.image && <p className="text-red-500 text-sm">{errors.image.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label className="font-medium">Preview</Label>
                  <div className="border rounded-lg h-[200px] flex items-center justify-center bg-gray-50 overflow-hidden">
                    {imagePreview ? (
                      <div className="relative w-full h-full">
                        <img
                          src={imagePreview || "/placeholder.svg"}
                          alt="Product preview"
                          className="object-contain w-full h-full p-2"
                        />
                        <Button
                          type="button"
                          onClick={clearImagePreview}
                          className="absolute top-2 right-2 h-6 w-6 bg-red-100 text-red-600 rounded-full p-1 hover:bg-red-200"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">No image selected</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t">
              <Button
                type="submit"
                className="bg-green-700 hover:bg-green-800 text-white py-6 px-5"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : "Save Product"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="py-6 px-5 bg-gray-300"
                onClick={() => {
                  reset()
                  setImagePreview(null)
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  )
}

export default AddProductForm;
