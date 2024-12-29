import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { MapPin, User as UserIcon, Clock } from 'lucide-react';

interface UserProfile {
  id: string;
  full_name: string;
  last_seen: string;
}

interface Location {
  latitude: number;
  longitude: number;
  timestamp: string;
  accuracy: number;
}

export function AdminDashboard() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('last_seen', { ascending: false });

      if (error) {
        console.error('Error fetching users:', error);
        return;
      }

      setUsers(data);
      setLoading(false);
    };

    fetchUsers();

    // Subscribe to real-time updates
    const usersSubscription = supabase
      .channel('user_profiles_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'user_profiles' 
      }, (payload) => {
        fetchUsers();
      })
      .subscribe();

    return () => {
      usersSubscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!selectedUser) return;

    const fetchLocations = async () => {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('user_id', selectedUser)
        .order('timestamp', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error fetching locations:', error);
        return;
      }

      setLocations(data);
    };

    fetchLocations();

    // Subscribe to real-time location updates
    const locationSubscription = supabase
      .channel('locations_changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'locations',
        filter: `user_id=eq.${selectedUser}`
      }, (payload) => {
        setLocations(prev => [payload.new as Location, ...prev.slice(0, 99)]);
      })
      .subscribe();

    return () => {
      locationSubscription.unsubscribe();
    };
  }, [selectedUser]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold mb-4">Users</h2>
            <div className="space-y-2">
              {users.map((user) => (
                <button
                  key={user.id}
                  onClick={() => setSelectedUser(user.id)}
                  className={`w-full text-left p-2 rounded ${
                    selectedUser === user.id
                      ? 'bg-blue-50 text-blue-700'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center">
                    <UserIcon className="h-5 w-5 mr-2" />
                    <div>
                      <div className="font-medium">{user.full_name}</div>
                      <div className="text-sm text-gray-500">
                        Last seen: {new Date(user.last_seen).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="md:col-span-2 bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold mb-4">Location History</h2>
            {selectedUser ? (
              <div className="space-y-2">
                {locations.map((location, index) => (
                  <div
                    key={index}
                    className="p-2 border-b last:border-b-0 hover:bg-gray-50"
                  >
                    <div className="flex items-center">
                      <MapPin className="h-5 w-5 mr-2 text-red-500" />
                      <div>
                        <div className="font-medium">
                          {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {new Date(location.timestamp).toLocaleString()}
                          {location.accuracy && (
                            <span className="ml-2">
                              Accuracy: ±{location.accuracy.toFixed(1)}m
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                Select a user to view their location history
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}