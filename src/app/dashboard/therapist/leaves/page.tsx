"use client";

import React, { useState, useEffect } from "react";
import { getTherapistLeaves, addTherapistLeave, removeTherapistLeave } from "@/lib/repos/therapists";
import { useAuth } from "@/context/AuthContext";
import { toast } from "react-hot-toast";

export default function TherapistLeavesPage() {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState<{ id: number; start_date: string; end_date: string; reason: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");

  const fetchLeaves = async () => {
    if (!user?.id) return;
    setLoading(true);
    const data = await getTherapistLeaves(user.id);
    setLeaves(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchLeaves();
  }, [user]);

  const handleAddLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !startDate || !endDate) return;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date(new Date().setHours(0,0,0,0));

    // check if start date is in past
    if (start < today) {
        toast.error("Cannot add leave for past dates");
        return;
    }
    
    if (end < start) {
        toast.error("End date must be after or equal to start date");
        return;
    }

    setLoading(true);
    const success = await addTherapistLeave(user.id, startDate, endDate, reason);
    if (success) {
      toast.success("Leave added successfully");
      setStartDate("");
      setEndDate("");
      setReason("");
      fetchLeaves();
    } else {
      toast.error("Failed to add leave");
      setLoading(false);
    }
  };

  const handleRemoveLeave = async (id: number) => {
    if (!user?.id) return;
    if (confirm("Are you sure you want to remove this leave?")) {
      const success = await removeTherapistLeave(id);
      if (success) {
        toast.success("Leave removed successfully");
        fetchLeaves();
      } else {
        toast.error("Failed to remove leave");
      }
    }
  };

  if (loading) return <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Manage Leaves & Unavailability</h1>
      <p className="text-gray-600 mb-8">
        Mark the dates you are unavailable. Patients will not be able to book appointments with you on these dates.
      </p>

      <div className="bg-white rounded-xl p-6 shadow-sm border mb-8">
        <h2 className="text-xl font-semibold mb-4">Add New Leave</h2>
        <form onSubmit={handleAddLeave} className="flex gap-4 items-end flex-wrap">
          <div className="flex-1 min-w-[150px]">
            <label className="block text-sm font-medium mb-1">Start Date *</label>
            <input
              type="date"
              required
              value={startDate}
              min={new Date().toISOString().split("T")[0]}
              onChange={(e) => {
                setStartDate(e.target.value);
                if (!endDate || e.target.value > endDate) setEndDate(e.target.value);
              }}
              className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-primary focus:outline-none"
            />
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="block text-sm font-medium mb-1">End Date *</label>
            <input
              type="date"
              required
              value={endDate}
              min={startDate || new Date().toISOString().split("T")[0]}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-primary focus:outline-none"
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium mb-1">Reason (Optional)</label>
            <input
              type="text"
              value={reason}
              placeholder="e.g. Out of town"
              onChange={(e) => setReason(e.target.value)}
              className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-primary focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-dark transition font-medium"
          >
            Add Leave(s)
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <h2 className="text-xl font-semibold p-6 border-b">Upcoming Leaves</h2>
        {leaves.length === 0 ? (
          <div className="p-6 text-gray-500 text-center">No leaves scheduled.</div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-600 text-sm">
              <tr>
                <th className="p-4 font-medium">Date</th>
                <th className="p-4 font-medium">Reason</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y text-sm">
              {leaves.map((leave) => {
                const startDateObj = new Date(leave.start_date);
                const endDateObj = new Date(leave.end_date);
                const isPast = endDateObj < new Date(new Date().setHours(0,0,0,0));
                
                return (
                  <tr key={leave.id} className={isPast ? "bg-gray-50 opacity-60" : "hover:bg-gray-50"}>
                    <td className="p-4 font-medium">
                      {startDateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      {leave.start_date !== leave.end_date && ` - ${endDateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
                      {isPast && <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">Past</span>}
                    </td>
                    <td className="p-4 text-gray-600">{leave.reason || '-'}</td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleRemoveLeave(leave.id)}
                        className="text-red-500 hover:text-red-700 font-medium"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
