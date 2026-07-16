import express from "express";
import axios from "axios";
import dotenv from "dotenv";
import Order from "../../models/Order.js";
import CourierSetting from "../../models/CourierSetting.js";

dotenv.config();
const router = express.Router();

// ✅ Generic order sender (works for all couriers)
// FINAL path: POST /api/v1/admin/send-order
router.post("/send-order", async (req, res) => {
  try {
    const { invoice, name, phone, address } = req.body;

    if (!invoice || !name || !phone || !address)
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });

    // 🔹 1️⃣ Get active courier config
    const activeCourier = await CourierSetting.findOne({ isActive: true });
    if (!activeCourier)
      return res
        .status(404)
        .json({ success: false, message: "No active courier found!" });

    const { courier, apiKey, secretKey, baseUrl } = activeCourier;

    console.log("🚚 Active Courier:", courier);

    // 🔹 2️⃣ Compute the real COD amount from the order — exclude the
    // delivery charge if it was already paid online (bKash/Nagad, verified)
    const order = await Order.findById(invoice);
    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "Order not found in database!" });

    const isManualPayment = (order.paymentMethod || "cod") !== "cod";
    const isAdvancePaid = isManualPayment && order.paymentStatus === "paid";
    const cod_amount = isAdvancePaid
      ? Math.max(0, Number(order.total || 0) - Number(order.deliveryCharge || 0))
      : Number(order.total || 0);

    // 🔹 2️⃣ Prepare payload based on courier
    let payload = {};
    if (courier === "steadfast") {
      payload = {
        invoice,
        recipient_name: name,
        recipient_phone: phone,
        recipient_address: address,
        cod_amount,
        delivery_type: 0,
        item_description: "General parcel",
        note: "Deliver within office hours",
      };
    } else if (courier === "pathao") {
      payload = {
        store_id: apiKey,
        recipient_name: name,
        recipient_phone: phone,
        recipient_address: address,
        amount_to_collect: cod_amount,
      };
    } else if (courier === "redx") {
      payload = {
        customer_name: name,
        customer_phone: phone,
        delivery_area: "Dhaka",
        customer_address: address,
        cash_collection_amount: cod_amount,
      };
    }

    // 🔹 3️⃣ Make API request dynamically
    const response = await axios.post(`${baseUrl}/create_order`, payload, {
      headers: {
        "Api-Key": apiKey,
        "Secret-Key": secretKey,
        "Content-Type": "application/json",
      },
    });

    console.log("✅ Courier Response:", response.data);

    // 🔹 4️⃣ Extract tracking ID
    const trackingCode =
      response.data?.consignment?.tracking_code ||
      response.data?.tracking_code ||
      response.data?.trackingId ||
      null;

    // 🔹 5️⃣ Update order with trackingId & courier info
    const updatedOrder = await Order.findByIdAndUpdate(
      invoice,
      { trackingId: trackingCode, courier },
      { new: true }
    );

    // যদি order না পাওয়া যায়
    if (!updatedOrder) {
      return res.status(404).json({
        success: false,
        message: "Order not found in database!",
      });
    }

    res.json({
      success: true,
      message: `${courier.toUpperCase()} order sent successfully!`,
      trackingId: trackingCode,
      courierResponse: response.data,
    });
  } catch (error) {
    console.error("🚨 Send order error:", error.message);
    res.status(500).json({
      success: false,
      message: "❌ Failed to send order",
      error: error.response?.data || error.message,
    });
  }
});

export default router;
