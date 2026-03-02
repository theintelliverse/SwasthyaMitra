import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
const API_URL = import.meta.env.VITE_API_URL;
const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const token = sessionStorage.getItem('token') || localStorage.getItem('token');

  useEffect(() => {
    const fetchProfile = async () => {
      const res = await axios.get(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(res.data.data);
    };
    fetchProfile();
  }, [token]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await axios.patch(`${API_URL}/api/auth/update-profile`, user, {
        headers: { Authorization: `Bearer ${token}` }
      });
      Swal.fire('Success', 'Profile updated successfully', 'success');
      setIsEditing(false);
    } catch {
      Swal.fire('Error', 'Update failed', 'error');
    }
  };

  if (!user) return <div className="p-10 text-center font-heading">Loading Profile...</div>;

  return (
    <div className="min-h-screen bg-parchment p-6 lg:p-10 font-body text-teak">
      <div className="max-w-4xl mx-auto bg-white rounded-[3rem] shadow-xl overflow-hidden border border-sandstone">

        {/* Banner Decor */}
        <div className="h-32 bg-marigold/20 w-full relative">
          <div className="absolute -bottom-12 left-10">
            <div className="w-24 h-24 bg-marigold rounded-3xl flex items-center justify-center text-4xl text-white shadow-lg border-4 border-white font-heading">
              {user.name.charAt(0)}
            </div>
          </div>
        </div>

        <div className="pt-16 px-10 pb-10">
          <div className="flex justify-between items-start mb-10">
            <div>
              <h1 className="text-3xl font-heading uppercase">{user.name}</h1>
              <p className="text-marigold font-bold text-xs tracking-widest uppercase mt-1">
                {user.role} {user.specialization ? `• ${user.specialization}` : ''}
              </p>
            </div>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-6 py-2 border-2 border-marigold text-marigold font-black text-[10px] uppercase rounded-full hover:bg-marigold hover:text-white transition-all"
            >
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>

          <form onSubmit={handleUpdate} className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase text-khaki">Full Name</label>
              <input
                disabled={!isEditing}
                className="w-full p-4 bg-parchment border border-sandstone rounded-2xl outline-none focus:border-marigold disabled:opacity-50"
                value={user.name}
                onChange={(e) => setUser({ ...user, name: e.target.value })}
              />
            </div>
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase text-khaki">Email Address</label>
              <input
                disabled // Email shouldn't be changed here
                className="w-full p-4 bg-parchment border border-sandstone rounded-2xl opacity-50"
                value={user.email}
              />
            </div>

            {user.role === 'doctor' && (
              <>
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase text-khaki">Education</label>
                  <input
                    disabled={!isEditing}
                    placeholder="MBBS, MD"
                    className="w-full p-4 bg-parchment border border-sandstone rounded-2xl outline-none focus:border-marigold"
                    value={user.education || ''}
                    onChange={(e) => setUser({ ...user, education: e.target.value })}
                  />
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase text-khaki">Years of Experience</label>
                  <input
                    type="number"
                    disabled={!isEditing}
                    className="w-full p-4 bg-parchment border border-sandstone rounded-2xl outline-none focus:border-marigold"
                    value={user.experience || ''}
                    onChange={(e) => setUser({ ...user, experience: e.target.value })}
                  />
                </div>
              </>
            )}

            <div className="md:col-span-2 space-y-4">
              <label className="text-[10px] font-black uppercase text-khaki">Professional Bio</label>
              <textarea
                disabled={!isEditing}
                maxLength="500"
                className="w-full p-4 bg-parchment border border-sandstone rounded-2xl outline-none focus:border-marigold h-32 resize-none"
                value={user.bio || ''}
                onChange={(e) => setUser({ ...user, bio: e.target.value })}
              />
            </div>

            {isEditing && (
              <button className="md:col-span-2 py-4 bg-teak text-parchment rounded-2xl font-bold hover:bg-marigold transition-all shadow-xl">
                Save Profile Changes
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;