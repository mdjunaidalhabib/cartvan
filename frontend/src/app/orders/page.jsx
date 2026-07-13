"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useUser } from "../../../context/UserContext";
import { apiFetch } from "../../../utils/api";
import Toast from "../../../components/home/Toast";
import EditOrderForm from "../../../components/orders/EditOrderForm";
import CourierStatus from "../../../components/CourierStatus";

// ✅ Date formatter
const formatDateTime = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })
    .format(date)
    .replace(",", " •");
};

export default function OrdersPage() {
  const { me, loadingUser } = useUser();

  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("lifetime");

  // Toast
  const [toast, setToast] = useState(null);

  // Edit modal
  const [editOrder, setEditOrder] = useState(null);
  const [saving, setSaving] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // ===============================
  // Toast helper
  // ===============================
  const showToast = (message, type = "success", time = 2000) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), time);
  };

  // ===============================
  // Fetch orders
  // ===============================
  useEffect(() => {
    if (!loadingUser && me) {
      (async () => {
        try {
          const data = await apiFetch(`/orders?userId=${me.userId}`);
          setOrders(data || []);
          setFilteredOrders(data || []);
        } catch (err) {
          console.error(err);
          setError("Failed to load orders");
        } finally {
          setLoadingOrders(false);
        }
      })();
    }
  }, [me, loadingUser]);

  // ===============================
  // Filter orders
  // ===============================
  useEffect(() => {
    if (!orders.length) return;

    const now = new Date();
    let cutoff = null;

    if (filter === "1m") {
      cutoff = new Date();
      cutoff.setMonth(now.getMonth() - 1);
    } else if (filter === "6m") {
      cutoff = new Date();
      cutoff.setMonth(now.getMonth() - 6);
    }

    const result = cutoff
      ? orders.filter((o) => new Date(o.createdAt) >= cutoff)
      : orders;

    setFilteredOrders(result);
    setCurrentPage(1);
  }, [filter, orders]);

  // ===============================
  // Pagination
  // ===============================
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  // ===============================
  // Update order
  // ===============================
  const saveBilling = async (billing) => {
    setSaving(true);
    try {
      const updated = await apiFetch(`/orders/${editOrder._id}`, {
        method: "PUT",
        body: JSON.stringify({ billing }),
      });

      setOrders((prev) =>
        prev.map((o) => (o._id === updated._id ? updated : o)),
      );

      setEditOrder(null);
      showToast("✅ Order updated");
    } catch {
      showToast("❌ Update failed", "error");
    } finally {
      setSaving(false);
    }
  };

  // ===============================
  // Cancel order
  // ===============================
  const cancelOrder = async (orderId) => {
    if (!confirm("Cancel this order?")) return;

    try {
      const updated = await apiFetch(`/orders/${orderId}`, {
        method: "PUT",
        body: JSON.stringify({
          status: "cancelled",
          cancelReason: "Cancelled by customer",
        }),
      });

      setOrders((prev) =>
        prev.map((o) => (o._id === updated._id ? updated : o)),
      );

      showToast("🚫 Order cancelled");
    } catch {
      showToast("❌ Cancel failed", "error");
    }
  };

  // ===============================
  // UI states
  // ===============================
  if (loadingUser || loadingOrders)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500 animate-pulse">Loading orders...</p>
      </div>
    );

  if (!me)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">You are not logged in</p>
      </div>
    );

  if (error)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-500">{error}</p>
      </div>
    );

  // ===============================
  // MAIN UI
  // ===============================
  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {editOrder && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-sm p-4">
            <h3 className="font-semibold mb-3">✏️ Edit Order</h3>
            <EditOrderForm
              billingData={editOrder.billing}
              loading={saving}
              onSave={saveBilling}
              onCancel={() => setEditOrder(null)}
            />
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto mt-10 px-4">
        {/* Header */}
        <div className="flex justify-between mb-6">
          <h1 className="text-2xl font-bold">My Orders</h1>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border rounded px-3 py-2 text-sm"
          >
            <option value="1m">Last 1 Month</option>
            <option value="6m">Last 6 Months</option>
            <option value="lifetime">Lifetime</option>
          </select>
        </div>

        {/* ===================== */}
        {/* Orders Responsive */}
        {/* ===================== */}
        <div className="bg-white shadow rounded-lg">
          {/* 📱 Mobile */}
          <div className="md:hidden divide-y">
            {paginatedOrders.map((order) => (
              <div key={order._id} className="p-3 space-y-1 text-xs">
                <div className="flex justify-between font-medium">
                  <span>Order</span>
                  <span className="truncate max-w-[60%]">
                    {order.orderNumber ? `#${order.orderNumber}` : order._id}
                  </span>
                </div>

                <div className="flex justify-between text-gray-500">
                  <span>Date</span>
                  <span>{formatDateTime(order.createdAt)}</span>
                </div>

                <div className="pb-1">
                  <CourierStatus trackingId={order.courier?.trackingId} />
                </div>

                <div className="flex gap-1">
                  <Link
                    href={`/orders/${order._id}`}
                    className="flex-1 text-center bg-blue-600 text-white rounded py-1.5 text-xs"
                  >
                    View
                  </Link>

                  {order.status === "pending" && (
                    <>
                      <button
                        onClick={() => setEditOrder(order)}
                        className="flex-1 bg-yellow-500 text-white rounded py-1.5 text-xs"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => cancelOrder(order._id)}
                        className="flex-1 bg-red-600 text-white rounded py-1.5 text-xs"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* 🖥 Desktop */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3 text-left">Order ID</th>
                  <th className="p-3 text-left">Date</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Total</th>
                  <th className="p-3 text-left">Courier</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedOrders.map((order) => (
                  <tr key={order._id} className="border-t">
                    <td className="p-3">
                      {order.orderNumber ? `#${order.orderNumber}` : order._id}
                    </td>
                    <td className="p-3">{formatDateTime(order.createdAt)}</td>
                    <td className="p-3 capitalize">{order.status}</td>
                    <td className="p-3">৳{order.total}</td>
                    <td className="p-3">
                      <CourierStatus trackingId={order.courier?.trackingId} />
                    </td>
                    <td className="p-3 flex justify-center gap-2">
                      <Link
                        href={`/orders/${order._id}`}
                        className="px-3 py-1 bg-blue-600 text-white rounded"
                      >
                        View
                      </Link>
                      {order.status === "pending" && (
                        <>
                          <button
                            onClick={() => setEditOrder(order)}
                            className="px-3 py-1 bg-yellow-500 text-white rounded"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => cancelOrder(order._id)}
                            className="px-3 py-1 bg-red-600 text-white rounded"
                          >
                            🚫 Cancel
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="flex justify-center gap-4 my-6">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
          >
            Previous
          </button>
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </>
  );
}
