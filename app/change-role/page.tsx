'use client';

import { collection, doc, getDoc, getDocs, updateDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react'
import { auth, db } from '../src/firebase';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { toast, Toaster } from 'sonner';
 
type User = {
  id: string;
  email: string;
  role: string;
  name: string;
}

const ChangeRole = () => {
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState<boolean>(true);

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
  
            if (userRole !== 'admin') {
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

  // Fetch all users with their roles
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'users'));
        const userList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          email: doc.data().email,
          role: doc.data().role,
          name: doc.data().name,
        })).filter((user) => user.id !== auth.currentUser?.uid);
        setUsers(userList);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    if (role === 'admin') {
      fetchUsers();
    }
  }, [role]);

  const filteredUsers = users.filter(
    (user) =>
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase())  ||
      user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRoleToggle = async (userId: string, newRole: 'admin' | 'user') => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { role: newRole });

      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === userId ? { ...user, role: newRole } : user
        )
      );

      toast.success(`User role updated to ${newRole}`);
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Failed to update user role');
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-16 w-16 border-4 border-gray-300 border-t-green-700 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (role !== 'admin') {
    return ;
  }

  return (
    <>
      <Toaster />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-8">
        <div className="max-w-[900px] mx-auto bg-white shadow-xl rounded-lg p-8">
          {/* Title */}
          <h1 className="text-2xl font-bold mb-8">
            Manage Users
          </h1>

          {/* Search Bar */}
          <div className="relative mb-6">
            <Input
              type="text"
              placeholder="Search by email or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition"
            />
          </div>

          {/* User List */}
          <ul className="divide-y divide-gray-200">
            {filteredUsers.map((user) => (
              <li
                key={user.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between py-4 hover:bg-gray-100 transition duration-300 px-4 rounded-lg"
              >
                <div className="flex flex-col">
                  <span className="font-semibold">{user.name}</span>
                  <span className="text-gray-500 text-sm">{user.email}</span>
                </div>

                <div className="flex items-center gap-3 mt-2 sm:mt-0">
                  <label className="flex items-center gap-3 mt-2 sm:mt-0">
                    <Switch
                      checked={user.role === 'user'}
                      onCheckedChange={async (checked) => {
                        const newRole = checked ? 'user' : 'admin';
                        await handleRoleToggle(user.id, newRole);
                      }}
                    />
                  </label>
                  <span
                    className={`text-sm font-semibold ${
                      user.role === 'user' ? 'text-blue-500' : 'text-gray-500'
                    }`}
                  >
                    {user.role === 'user' ? 'User' : 'Admin'}
                  </span>
                </div>
              </li>
            ))}

            {filteredUsers.length === 0 && (
              <li className="text-gray-500 py-6 text-xl text-center">
                No users found.
              </li>
            )}
          </ul>
        </div>
      </div>
    </>
  );
};

export default ChangeRole;
