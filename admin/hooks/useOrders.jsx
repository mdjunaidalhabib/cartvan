"use client";
import { useEffect, useRef, useState } from "react";

export default function useOrders(API) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ===============================
     🔁 QUEUE
     =============================== */
  const queueRef = useRef(Promise.resolve());

  const enqueue = (task) => {
    queueRef.current = queueRef.current.then(() => task()).catch(() => {});
    return queueRef.current;
  };

  /* ===============================
     🔔 TOAST
     =============================== */
  const [toast, setToast] = useState(null);

  /* ===============================
     ❓ CONFIRM
     =============================== */
  const [confirm, setConfirm] = useState(null);

  /* ===============================
     🗑 DELETE LOADING
     =============================== */
  const [deleting, setDeleting] = useState(false);

  /* ===============================
     Auto hide toast
     =============================== */
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  /* ===============================
     Fetch orders
     =============================== */
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/admin/orders`);
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch {
      setToast({ message: "❌ Failed to load orders", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  /* ===============================
     Update status (single) – SILENT SUPPORT
     =============================== */
  const updateStatus = (id, payload, options = {}) =>
    enqueue(async () => {
      try {
        const res = await fetch(`${API}/admin/orders/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const updated = await res.json();
        if (!res.ok) throw new Error(updated?.error);

        setOrders((prev) =>
          prev.map((o) => (o._id === updated._id ? updated : o))
        );

        if (!options.silent) {
          setToast({ message: "✔ Order updated", type: "success" });
        }

        return updated;
      } catch (err) {
        // ❗ error কখনো silent হবে না
        setToast({
          message: err?.message || "❌ Status update failed",
          type: "error",
        });
        throw err;
      }
    });

  /* ===============================
     Update status (bulk)
     =============================== */
  const updateManyStatus = (ids, payload) =>
    setConfirm({
      title: "Update order status?",
      message: `Change status for ${ids.length} orders.`,
      onConfirm: async () => {
        try {
          const res = await fetch(`${API}/admin/orders/bulk/status`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ids,
              status: payload.status,
              cancelReason: payload.cancelReason,
            }),
          });

          const data = await res.json();
          if (!res.ok) throw new Error(data.error);

          setOrders((prev) =>
            prev.map((o) =>
              data.updated.includes(o._id)
                ? { ...o, status: payload.status }
                : o
            )
          );

          setToast({
            message: `✔ ${data.updated.length} orders updated`,
            type: "success",
          });
        } catch (err) {
          setToast({
            message: err.message || "❌ Bulk update failed",
            type: "error",
          });
        } finally {
          setConfirm(null);
        }
      },
    });

  /* ===============================
     🚚 COURIER (SINGLE) – FINAL & SAFE
     =============================== */
const sendCourierDirect = (order) =>
  enqueue(async () => {
    try {
      if (!order) throw new Error("Invalid order");

      /* 1️⃣ CREATE COURIER ORDER */
      const res = await fetch(`${API}/admin/api/send-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoice: order._id,
          name: order.billing?.name,
          phone: order.billing?.phone,
          address: order.billing?.address,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          data?.error || data?.message || "Courier sending failed"
        );
      }

      /* 2️⃣ LOCAL STATE SYNC (IMPORTANT) */
      if (data.order) {
        setOrders((prev) =>
          prev.map((o) => (o._id === data.order._id ? data.order : o))
        );
      }

      /* 3️⃣ SUCCESS TOAST */
      setToast({
        message: "🚚 Courier order created & status updated",
        type: "success",
      });

      return data;
    } catch (err) {
      const msg = err?.message?.toLowerCase() || "";

      const friendlyMessage =
        msg.includes("courier") || msg.includes("setting")
          ? "Courier সেটিং পাওয়া যায়নি বা inactive"
          : err.message;

      setToast({
        message: friendlyMessage,
        type: "error",
      });

      throw err;
    }
  });


  /* ===============================
     Courier (bulk)
     =============================== */
  const sendCourierMany = (orders) =>
    setConfirm({
      title: "Send to courier?",
      message: `Send ${orders.length} orders to courier service.`,
      onConfirm: async () => {
        try {
          for (const o of orders) {
            if (o.status !== "ready_to_delivery") continue;
            await sendCourierDirect(o);
          }

          setToast({
            message: "🚚 Orders sent to courier",
            type: "success",
          });
        } catch (err) {
          setToast({
            message: err.message || "❌ Courier sending failed",
            type: "error",
          });
        } finally {
          setConfirm(null);
        }
      },
    });

  /* ===============================
     🗑 DELETE (single)
     =============================== */
  const handleDelete = async (order) => {
    if (!order) return;

    try {
      setDeleting(true);
      const res = await fetch(`${API}/admin/orders/${order._id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error();

      setOrders((prev) => prev.filter((o) => o._id !== order._id));
      setToast({ message: "🗑 Order deleted", type: "success" });
    } catch {
      setToast({ message: "❌ Delete failed", type: "error" });
    } finally {
      setDeleting(false);
      setConfirm(null);
    }
  };

  /* ===============================
     Delete (bulk)
     =============================== */
  const deleteMany = (ids) =>
    setConfirm({
      title: "Delete orders?",
      message: `${ids.length} orders will be permanently deleted.`,
      danger: true,
      confirmText: "Delete",
      onConfirm: async () => {
        try {
          const res = await fetch(`${API}/admin/orders/bulk/delete`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ids }),
          });

          const data = await res.json();
          if (!res.ok) throw new Error(data.error);

          setOrders((prev) => prev.filter((o) => !ids.includes(o._id)));
          setToast({
            message: `🗑 ${data.deletedCount} orders deleted`,
            type: "success",
          });
        } catch (err) {
          setToast({
            message: err.message || "❌ Bulk delete failed",
            type: "error",
          });
        } finally {
          setConfirm(null);
        }
      },
    });

  /* ===============================
     RETURN
     =============================== */
  return {
    filtered: orders,
    loading,
    fetchOrders,

    // status
    updateStatus,
    updateManyStatus,

    // courier
    sendCourierDirect,
    sendCourierMany,

    // delete
    handleDelete,
    deleteMany,
    deleting,

    // ui
    toast,
    setToast,
    confirm,
    setConfirm,
  };
}
