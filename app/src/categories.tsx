import { collection, addDoc, getDocs, query, where, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { db } from './firebase';
 
const categories = [
  'Vegetables & Fruits',
  'Dairy & Breakfast',
  'Munchies',
  'Cold Drinks & Juices',
  'Instant & Frozen Food',
  'Tea, Coffee & Health Drinks',
  'Bakery & Biscuits',
  'Sweet Tooth',
  'Atta, Rice & Dal',
  'Dry Fruits, Masala & Oil',
  'Sauces & Spreads',
  'Chicken, Meat & Fish',
  'Paan Corner',
  'Organic & Premium',
  'Baby Care',
  'Pharma & Wellness',
  'Cleaning Essentials',
  'Home & Office',
  'Ice Creams & Frozen Desserts',
  'Books',
  'Stationery Needs',
  'Toys & Games',
  'Electronics & Electricals',
];

const uploadCategories = async () => {
  try {
    const collectionRef = collection(db, 'categories');

    const querySnapshot = await getDocs(collectionRef);
    const existingCategories = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      name: doc.data().name,
    }));

    for (let i = 0; i < categories.length; i++) {
      const category = categories[i];
      const q = query(collectionRef, where('name', '==', category));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        await addDoc(collectionRef, { name: category, order: i });
        console.log(`Added category: ${category}`);
      }
    }

    for (const existingCategory of existingCategories) {
      if (!categories.includes(existingCategory.name)) {
        await deleteDoc(doc(collectionRef, existingCategory.id));
        console.log(`Deleted category: ${existingCategory.name}`);
      }
    }

    console.log('Categories synced successfully');
    window.location.reload();
  } catch (error) {
    console.error('Error syncing categories: ', error);
  }
};

export default uploadCategories;
