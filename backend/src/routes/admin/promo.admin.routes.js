import express from "express";
import mongoose from "mongoose";
import Promo from "../../models/Promo.js";
import PromoRedemption from "../../models/PromoRedemption.js";
import { protect } from "../../middlewares/adminAuthMiddleware.js";
import { normalizePromoCode } from "../../services/promoService.js";
import PromoSetting, {
  PROMO_SETTING_KEY,
} from "../../models/PromoSetting.js";
import {
  DEFAULT_PROMO_SETTINGS,
  getOrCreatePromoSettings,
  getPublicPromoSettings,
} from "../../services/promoSettingsService.js";

const router = express.Router();
router.use(protect);

const nullableNumber = (value) => {
  if (value === "" || value === null || value === undefined) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const numberOr = (value, fallback) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const objectIdArray = (value) =>
  [...new Set(Array.isArray(value) ? value : [])]
    .map(String)
    .filter((id) => mongoose.Types.ObjectId.isValid(id));

const stringArray = (value) =>
  [...new Set(Array.isArray(value) ? value : [])]
    .map((item) => String(item).trim())
    .filter(Boolean);

const dateOrNull = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const escapeRegex = (value) =>
  String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const promoPayload = (body, adminId) => ({
  code: normalizePromoCode(body.code),
  title: String(body.title || "").trim(),
  description: String(body.description || "").trim(),
  discountType: body.discountType,
  discountValue: numberOr(body.discountValue, 0),
  maxDiscountAmount: nullableNumber(body.maxDiscountAmount),
  minimumOrderAmount: Math.max(
    0,
    numberOr(body.minimumOrderAmount, 0),
  ),
  minimumQuantity: Math.max(
    1,
    Math.floor(numberOr(body.minimumQuantity, 1)),
  ),
  appliesTo: ["all", "products", "categories"].includes(body.appliesTo)
    ? body.appliesTo
    : "all",
  applicableProductIds: objectIdArray(body.applicableProductIds),
  applicableCategoryIds: objectIdArray(body.applicableCategoryIds),
  excludedProductIds: objectIdArray(body.excludedProductIds),
  allowedPaymentMethods: stringArray(body.allowedPaymentMethods),
  firstOrderOnly: !!body.firstOrderOnly,
  totalUsageLimit: nullableNumber(body.totalUsageLimit),
  usageLimitPerCustomer: Math.max(
    1,
    Math.floor(numberOr(body.usageLimitPerCustomer, 1)),
  ),
  startDate: dateOrNull(body.startDate),
  endDate: dateOrNull(body.endDate),
  isActive: body.isActive !== undefined ? !!body.isActive : true,
  updatedBy: adminId || null,
});

const computedStatus = (promo) => {
  if (promo.isArchived) return "archived";
  if (!promo.isActive) return "inactive";
  const now = new Date();
  if (promo.startDate && now < promo.startDate) return "scheduled";
  if (promo.endDate && now > promo.endDate) return "expired";
  if (
    promo.totalUsageLimit &&
    promo.usedCount >= promo.totalUsageLimit
  ) {
    return "exhausted";
  }
  return "active";
};

router.get("/settings", async (req, res) => {
  try {
    const setting = await getOrCreatePromoSettings();
    const publicState = await getPublicPromoSettings();
    return res.json({
      ...setting.toObject(),
      hasAvailablePromo: publicState.hasAvailablePromo,
    });
  } catch (error) {
    return res.status(500).json({
      error: error?.message || "Promo settings load failed",
    });
  }
});

router.put("/settings", async (req, res) => {
  try {
    const availableMessage = String(
      req.body.availableMessage ?? DEFAULT_PROMO_SETTINGS.availableMessage,
    )
      .trim()
      .slice(0, 300);
    const unavailableMessage = String(
      req.body.unavailableMessage ??
        DEFAULT_PROMO_SETTINGS.unavailableMessage,
    )
      .trim()
      .slice(0, 300);

    const setting = await PromoSetting.findOneAndUpdate(
      { key: PROMO_SETTING_KEY },
      {
        $set: {
          showPromoField: req.body.showPromoField !== false,
          showAvailabilityMessage:
            req.body.showAvailabilityMessage !== false,
          availableMessage:
            availableMessage || DEFAULT_PROMO_SETTINGS.availableMessage,
          unavailableMessage:
            unavailableMessage || DEFAULT_PROMO_SETTINGS.unavailableMessage,
          updatedBy: req.admin?._id || null,
        },
        $setOnInsert: { key: PROMO_SETTING_KEY },
      },
      { new: true, upsert: true, runValidators: true },
    );

    const publicState = await getPublicPromoSettings();
    return res.json({
      ...setting.toObject(),
      hasAvailablePromo: publicState.hasAvailablePromo,
    });
  } catch (error) {
    return res.status(400).json({
      error: error?.message || "Promo settings update failed",
    });
  }
});

router.get("/stats", async (req, res) => {
  try {
    const promos = await Promo.find({ isArchived: false }).lean();
    const redemptions = await PromoRedemption.aggregate([
      {
        $group: {
          _id: null,
          redemptions: { $sum: 1 },
          totalDiscount: { $sum: "$discountAmount" },
          totalShippingDiscount: { $sum: "$shippingDiscount" },
        },
      },
    ]);
    const row = redemptions[0] || {};
    res.json({
      total: promos.length,
      active: promos.filter(
        (promo) => computedStatus(promo) === "active",
      ).length,
      scheduled: promos.filter(
        (promo) => computedStatus(promo) === "scheduled",
      ).length,
      expired: promos.filter((promo) =>
        ["expired", "exhausted"].includes(computedStatus(promo)),
      ).length,
      redemptions: row.redemptions || 0,
      totalSavings:
        (row.totalDiscount || 0) + (row.totalShippingDiscount || 0),
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: error.message || "Failed to load promo stats" });
  }
});

router.get("/", async (req, res) => {
  try {
    const {
      search = "",
      status = "all",
      includeArchived = "false",
    } = req.query;
    const query = {};
    if (status === "archived") query.isArchived = true;
    else if (includeArchived !== "true") query.isArchived = false;

    if (search) {
      const safeSearch = escapeRegex(search);
      query.$or = [
        { code: new RegExp(safeSearch, "i") },
        { title: new RegExp(safeSearch, "i") },
      ];
    }

    const promos = await Promo.find(query)
      .populate("applicableProductIds", "name image price")
      .populate("applicableCategoryIds", "name")
      .populate("excludedProductIds", "name")
      .sort({ createdAt: -1 })
      .lean();

    const mapped = promos.map((promo) => ({
      ...promo,
      computedStatus: computedStatus(promo),
    }));
    res.json(
      status === "all"
        ? mapped
        : mapped.filter((promo) => promo.computedStatus === status),
    );
  } catch (error) {
    res
      .status(500)
      .json({ error: error.message || "Failed to load promo codes" });
  }
});

router.get("/:id/redemptions", async (req, res) => {
  try {
    const rows = await PromoRedemption.find({ promo: req.params.id })
      .populate(
        "order",
        "orderNumber billing total status createdAt",
      )
      .sort({ createdAt: -1 })
      .limit(300)
      .lean();
    res.json(rows);
  } catch (error) {
    res
      .status(500)
      .json({ error: error.message || "Failed to load promo usage" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const promo = await Promo.findById(req.params.id).lean();
    if (!promo) {
      return res.status(404).json({ error: "Promo code not found" });
    }
    res.json({ ...promo, computedStatus: computedStatus(promo) });
  } catch (error) {
    res.status(400).json({ error: error.message || "Invalid promo ID" });
  }
});

router.post("/", async (req, res) => {
  try {
    const payload = promoPayload(req.body, req.admin?._id);
    if (!payload.code) {
      return res.status(400).json({ error: "Promo code is required" });
    }
    payload.createdBy = req.admin?._id || null;
    const promo = await Promo.create(payload);
    res.status(201).json(promo);
  } catch (error) {
    const duplicate = error?.code === 11000;
    res.status(duplicate ? 409 : 400).json({
      error: duplicate
        ? "এই promo code ইতিমধ্যে আছে।"
        : error.message,
    });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const current = await Promo.findById(req.params.id);
    if (!current) {
      return res.status(404).json({ error: "Promo code not found" });
    }

    const payload = promoPayload(req.body, req.admin?._id);
    Object.assign(current, payload);
    await current.save();
    res.json(current);
  } catch (error) {
    const duplicate = error?.code === 11000;
    res.status(duplicate ? 409 : 400).json({
      error: duplicate
        ? "এই promo code ইতিমধ্যে আছে।"
        : error.message,
    });
  }
});

router.patch("/:id/status", async (req, res) => {
  try {
    const promo = await Promo.findByIdAndUpdate(
      req.params.id,
      {
        isActive: !!req.body.isActive,
        updatedBy: req.admin?._id || null,
      },
      { new: true, runValidators: true },
    );
    if (!promo) {
      return res.status(404).json({ error: "Promo code not found" });
    }
    res.json(promo);
  } catch (error) {
    res
      .status(400)
      .json({ error: error.message || "Status update failed" });
  }
});

router.post("/:id/duplicate", async (req, res) => {
  try {
    const source = await Promo.findById(req.params.id).lean();
    if (!source) {
      return res.status(404).json({ error: "Promo code not found" });
    }

    const { _id, createdAt, updatedAt, usedCount, ...copy } = source;
    copy.code = normalizePromoCode(
      req.body.code || `${source.code}-COPY`,
    );
    copy.title =
      req.body.title !== undefined
        ? String(req.body.title)
        : source.title;
    copy.usedCount = 0;
    copy.isArchived = false;
    copy.isActive = false;
    copy.createdBy = req.admin?._id || null;
    copy.updatedBy = req.admin?._id || null;

    const created = await Promo.create(copy);
    res.status(201).json(created);
  } catch (error) {
    res.status(error?.code === 11000 ? 409 : 400).json({
      error:
        error?.code === 11000
          ? "Duplicate code already exists"
          : error.message,
    });
  }
});

router.patch("/:id/restore", async (req, res) => {
  try {
    const promo = await Promo.findByIdAndUpdate(
      req.params.id,
      {
        isArchived: false,
        isActive: false,
        updatedBy: req.admin?._id || null,
      },
      { new: true },
    );
    if (!promo) {
      return res.status(404).json({ error: "Promo code not found" });
    }
    res.json({ message: "Promo restored as inactive", promo });
  } catch (error) {
    res
      .status(400)
      .json({ error: error.message || "Promo restore failed" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const promo = await Promo.findByIdAndUpdate(
      req.params.id,
      {
        isArchived: true,
        isActive: false,
        updatedBy: req.admin?._id || null,
      },
      { new: true },
    );
    if (!promo) {
      return res.status(404).json({ error: "Promo code not found" });
    }
    res.json({ message: "Promo code archived successfully" });
  } catch (error) {
    res
      .status(400)
      .json({ error: error.message || "Promo delete failed" });
  }
});

export default router;
