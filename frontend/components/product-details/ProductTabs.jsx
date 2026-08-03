"use client";

import { useEffect, useState } from "react";
import { FaUser } from "react-icons/fa";
import { FiEdit2, FiX, FiTrash2 } from "react-icons/fi";
import AddReviewForm from "./AddReviewForm";
import { useUser } from "../../context/UserContext";
import { apiFetch } from "../../utils/api";

// ✅ পুরনো প্রোডাক্টের description/additionalInfo (rich text editor আসার আগে সেভ করা)
// প্লেইন টেক্সট হিসেবে DB তে আছে — সেগুলোকে নিরাপদে HTML প্যারাগ্রাফে রূপান্তর করা হয়,
// নতুন প্রোডাক্টের ক্ষেত্রে ইতিমধ্যে sanitize করা HTML যেমন আছে তেমনই ব্যবহার হবে
const NBSP_CHAR = String.fromCharCode(160);
const REGULAR_SPACE = String.fromCharCode(32);

// ✅ TipTap এডিটরে একাধিক স্পেস চাপলে non-breaking space বসে যায়, যেটা সাধারণ
// স্পেসের চেয়ে চওড়া এবং বড় ফাঁকা তৈরি করে। আগে থেকে সেভ হওয়া প্রোডাক্টেও এটা
// থাকতে পারে বলে এখানেও normalize করে নেওয়া হয়
function normalizeSpaces(html) {
  return html
    .split(NBSP_CHAR)
    .join(REGULAR_SPACE)
    .replace(/&nbsp;/gi, REGULAR_SPACE)
    .replace(/[\t ]{2,}/g, REGULAR_SPACE);
}

function toSafeHtml(value) {
  if (!value) return "";
  if (/<[a-z][\s\S]*>/i.test(value)) return normalizeSpaces(value);
  const esc = (s) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return normalizeSpaces(
    value
      .split(/\n{2,}/)
      .map((para) => `<p>${esc(para).replace(/\n/g, "<br>")}</p>`)
      .join("")
  );
}

export default function ProductTabs({ product, tab, setTab }) {
  const { me } = useUser();

  // Always use MongoDB _id for ownership
  const myId = me?._id ? String(me._id) : null;

  // Local reviews state
  const [reviews, setReviews] = useState(product?.reviews || []);

  // Modal + edit state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingReview, setEditingReview] = useState(null); // full review object
  const [editForm, setEditForm] = useState({ rating: 5, comment: "" });

  useEffect(() => {
    setReviews(product?.reviews || []);
  }, [product]);

  const tabBtn = (key, label) => (
    <button
      type="button"
      key={key}
      onClick={() => setTab(key)}
      className={`px-2 py-2 rounded-lg text-xs md:text-sm font-medium transition-all duration-200 ${
        tab === key
          ? "bg-pink-500 text-white shadow"
          : "text-gray-600 hover:bg-gray-200"
      }`}
    >
      {label}
    </button>
  );

  // open modal (start edit)
  const openEditModal = (r) => {
    setEditingReview(r);
    setEditForm({
      rating: r.rating || 5,
      comment: r.comment || "",
    });
    setIsEditOpen(true);
  };

  // close modal
  const closeEditModal = () => {
    setIsEditOpen(false);
    setEditingReview(null);
    setEditForm({ rating: 5, comment: "" });
  };

  // Save edit
  const saveEdit = async () => {
    if (!editingReview?._id) return;

    try {
      const data = await apiFetch(
        `/products/${product?._id}/review/${editingReview._id}`,
        {
          method: "PUT",
          body: JSON.stringify(editForm),
        }
      );

      setReviews(data?.reviews || []);
      closeEditModal();
    } catch (err) {
      alert(err.message);
    }
  };

  // Delete review (from modal)
  const handleDelete = async () => {
    if (!editingReview?._id) return;

    const ok = confirm("Are you sure you want to delete this review?");
    if (!ok) return;

    try {
      const data = await apiFetch(
        `/products/${product?._id}/review/${editingReview._id}`,
        { method: "DELETE" }
      );

      setReviews(data?.reviews || []);
      closeEditModal();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <section className="mt-12">
      {/* Tabs Header */}
      <div className="border-b flex border-gray-200">
        <div className="max-w-6xl mx-auto flex gap-1 md:gap-4">
          {tabBtn("desc", "Description")}
          {tabBtn("info", "return policy")}
          {tabBtn("reviews", `Reviews (${reviews?.length || 0})`)}
        </div>
      </div>

      {/* Tabs Content */}
      <div className="max-w-6xl mx-auto py-8">
        {/* Description Tab */}
        {tab === "desc" &&
          (product?.description ? (
            <div
              lang="en"
              className="rich-content text-gray-700 text-[15px]"
              dangerouslySetInnerHTML={{ __html: toSafeHtml(product.description) }}
            />
          ) : (
            <div className="text-gray-500 text-center">
              No description available for this product.
            </div>
          ))}

        {/* Information Tab */}
        {tab === "info" &&
          (product?.additionalInfo ? (
            <div
              lang="en"
              className="rich-content text-gray-700 text-[15px]"
              dangerouslySetInnerHTML={{ __html: toSafeHtml(product.additionalInfo) }}
            />
          ) : (
            <div className="text-gray-500 text-center">
              No additional info available for this product.
            </div>
          ))}

        {/* Reviews Tab */}
        {tab === "reviews" && (
          <div className="space-y-8">
            {/* Add Review Form */}
            <AddReviewForm
              productId={product?._id}
              onSuccess={(data) => setReviews(data?.reviews || [])}
            />

            {/* Reviews List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {reviews?.length ? (
                reviews.map((r) => {
                  const reviewOwnerId =
                    typeof r?.userId === "object" && r?.userId?._id
                      ? String(r.userId._id)
                      : r?.userId
                      ? String(r.userId)
                      : null;

                  const isOwner =
                    myId && reviewOwnerId && myId === reviewOwnerId;

                  return (
                    <div
                      key={r._id}
                      className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm relative"
                    >
                      {/* Pencil icon top-right (owner only) */}
                      {isOwner && (
                        <button
                          type="button"
                          onClick={() => openEditModal(r)}
                          className="absolute top-4 right-4 p-2 rounded-full bg-gray-100 hover:bg-gray-200"
                          aria-label="Edit review"
                          title="Edit"
                        >
                          <FiEdit2 />
                        </button>
                      )}

                      {/* Header */}
                      <div className="flex items-center gap-3 mb-3">
                        {r.avatar ? (
                          <img
                            src={r.avatar}
                            alt={r.user}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <FaUser className="text-gray-500" />
                          </div>
                        )}

                        <div className="flex-1 pr-10">
                          <p className="font-semibold text-gray-900">
                            {r.user}
                          </p>
                          <div className="flex text-yellow-400 text-sm mt-1">
                            {"★".repeat(r.rating)}
                            {"☆".repeat(5 - r.rating)}
                          </div>
                        </div>
                      </div>

                      {/* Always read mode */}
                      <p className="text-gray-600 text-sm leading-6">
                        {r.comment}
                      </p>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-2">
                  <div className="text-center text-gray-500">
                    No reviews yet for this product.
                  </div>
                </div>
              )}
            </div>

            {/* EDIT MODAL */}
            {isEditOpen && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-3"
                onClick={closeEditModal}
              >
                <div
                  className="w-full max-w-md rounded-2xl bg-white p-5 shadow-lg"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Edit Review
                    </h3>

                    <button
                      type="button"
                      onClick={closeEditModal}
                      className="p-2 rounded-full hover:bg-gray-100"
                      aria-label="Close"
                    >
                      <FiX />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <select
                      value={editForm.rating}
                      onChange={(e) =>
                        setEditForm((p) => ({
                          ...p,
                          rating: Number(e.target.value),
                        }))
                      }
                      className="border rounded-lg px-3 py-2 w-full"
                    >
                      {[5, 4, 3, 2, 1].map((x) => (
                        <option key={x} value={x}>
                          {x} Star
                        </option>
                      ))}
                    </select>

                    <textarea
                      value={editForm.comment}
                      onChange={(e) =>
                        setEditForm((p) => ({
                          ...p,
                          comment: e.target.value,
                        }))
                      }
                      className="border rounded-lg px-3 py-2 w-full min-h-[110px]"
                      placeholder="Write your updated review..."
                    />

                    <div className="flex items-center justify-between gap-3 pt-2">
                      <button
                        type="button"
                        onClick={handleDelete}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded bg-red-100 text-red-700 hover:bg-red-200"
                      >
                        <FiTrash2 />
                        Delete
                      </button>

                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={closeEditModal}
                          className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200"
                        >
                          Cancel
                        </button>

                        <button
                          type="button"
                          onClick={saveEdit}
                          className="px-4 py-2 rounded bg-pink-500 text-white hover:bg-pink-600"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
