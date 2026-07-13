"use client";
import { useEffect, useState } from "react";
import OrderSummarySkeleton from "../skeletons/OrderSummarySkeleton";

export default function OrderSummary({ orderId }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;

    setLoading(true);

    fetch(`/api/orders/${orderId}`)
      .then((res) => res.json())
      .then(setOrder)
      .catch((err) => {
        console.error("❌ Failed to fetch order:", err);
        setOrder(null);
      })
      .finally(() => setLoading(false));
  }, [orderId]);

  if (loading) return <OrderSummarySkeleton />;
  if (!order)
    return (
      <p className="text-center text-red-500 mt-10">
        ❌ অর্ডার খুঁজে পাওয়া যায়নি
      </p>
    );

  return (
    <div className="max-w-sm mx-auto my-4 bg-white shadow rounded-lg divide-y divide-gray-200 text-sm">
      {/* Header */}
      <div className="p-3 text-center">
        <h2 className="text-base font-semibold text-green-700">
          🎉 অর্ডার সফল!
        </h2>
        <p className="text-gray-500 text-xs mt-0.5">
          ধন্যবাদ আমাদের থেকে অর্ডার করার জন্য 💚
        </p>
      </div>

      {/* Order Info */}
      <div className="p-3 space-y-0.5">
        <p>
          <strong>Order ID:</strong> {order._id}
        </p>
        <p>
          <strong>Date:</strong> {new Date(order.createdAt).toLocaleString()}
        </p>
        <p>
          <strong>Status:</strong>{" "}
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
              order.status === "pending"
                ? "bg-yellow-100 text-yellow-700"
                : order.status === "completed"
                ? "bg-green-100 text-green-700"
                : "bg-gray-200 text-gray-600"
            }`}
          >
            {String(order.status || "").toUpperCase()}
          </span>
        </p>
      </div>

      {/* Billing */}
      <div className="p-3 space-y-0.5">
        <h3 className="font-semibold text-gray-700 text-xs mb-1">🧾 Billing</h3>
        <p>
          <strong>Name:</strong> {order.billing?.name}
        </p>
        <p>
          <strong>Mobile:</strong> {order.billing?.phone}
        </p>
        <p>
          <strong>Address:</strong> {order.billing?.address}
        </p>
        {order.billing?.note && (
          <p className="italic text-gray-500">
            <strong>Note:</strong> {order.billing.note}
          </p>
        )}
      </div>

      {/* Product List */}
      <div className="p-3 space-y-1">
        <h3 className="font-semibold text-gray-700 text-xs mb-1">📦 Items</h3>
        {order.items?.map((item, i) => (
          <div
            key={i}
            className="flex items-center justify-between p-1 border rounded-lg hover:shadow-sm transition text-xs"
          >
            <div className="flex items-center gap-2">
              <img
                src={item.image || "/placeholder.png"}
                alt={item.name}
                className="w-9 h-9 object-cover rounded"
              />
              <div>
                <p className="font-medium">{item.name}</p>
                <p className="text-gray-500">Qty: {item.qty}</p>
              </div>
            </div>
            <div className="text-right font-medium">
              ৳{item.price * item.qty}
            </div>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="p-3 text-right space-y-0.5">
        <p>Subtotal: ৳{order.subtotal}</p>
        <p>Delivery: ৳{order.deliveryCharge}</p>
        {order.discount > 0 && <p>Discount: -৳{order.discount}</p>}
        <p className="text-green-700 font-semibold text-sm">
          Total: ৳{order.total}
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-2 p-3">
        <a
          href={`/api/invoice/${orderId}`}
          target="_blank"
          rel="noreferrer"
          className="flex-1 bg-blue-600 text-white py-1.5 rounded text-center hover:bg-blue-700 text-xs"
        >
          🧾 Download Invoice
        </a>

        <a
          href="/"
          className="flex-1 bg-indigo-600 text-white py-1.5 rounded text-center hover:bg-indigo-700 text-xs"
        >
          🏠 Home
        </a>
      </div>
    </div>
  );
}
