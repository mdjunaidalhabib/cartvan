import Promo from "../models/Promo.js";
import PromoSetting, {
  PROMO_SETTING_KEY,
} from "../models/PromoSetting.js";

export const DEFAULT_PROMO_SETTINGS = Object.freeze({
  showPromoField: true,
  showAvailabilityMessage: true,
  availableMessage: "Promo code থাকলে এখানে ব্যবহার করে discount নিন।",
  unavailableMessage: "এই মুহূর্তে কোনো promo code available নেই।",
});

export const getOrCreatePromoSettings = async () => {
  try {
    return await PromoSetting.findOneAndUpdate(
      { key: PROMO_SETTING_KEY },
      {
        $setOnInsert: {
          key: PROMO_SETTING_KEY,
          ...DEFAULT_PROMO_SETTINGS,
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
  } catch (error) {
    // Two first-time requests can race on the singleton upsert. The unique
    // key guarantees one winner; the other request simply reads that row.
    if (error?.code === 11000) {
      return PromoSetting.findOne({ key: PROMO_SETTING_KEY });
    }
    throw error;
  }
};

export const isPromoCurrentlyAvailable = (promo, now = new Date()) => {
  if (!promo || promo.isArchived || !promo.isActive) return false;
  if (promo.startDate && now < new Date(promo.startDate)) return false;
  if (promo.endDate && now > new Date(promo.endDate)) return false;
  if (
    promo.totalUsageLimit &&
    Number(promo.usedCount || 0) >= Number(promo.totalUsageLimit)
  ) {
    return false;
  }
  return true;
};

export const getPublicPromoSettings = async () => {
  const [setting, promos] = await Promise.all([
    getOrCreatePromoSettings(),
    Promo.find({ isArchived: false, isActive: true })
      .select("startDate endDate totalUsageLimit usedCount isActive isArchived")
      .lean(),
  ]);

  const hasAvailablePromo = promos.some((promo) =>
    isPromoCurrentlyAvailable(promo),
  );
  const plain = setting.toObject();

  return {
    showPromoField: plain.showPromoField !== false,
    showAvailabilityMessage: plain.showAvailabilityMessage !== false,
    availableMessage:
      plain.availableMessage || DEFAULT_PROMO_SETTINGS.availableMessage,
    unavailableMessage:
      plain.unavailableMessage || DEFAULT_PROMO_SETTINGS.unavailableMessage,
    hasAvailablePromo,
    message: hasAvailablePromo
      ? plain.availableMessage || DEFAULT_PROMO_SETTINGS.availableMessage
      : plain.unavailableMessage || DEFAULT_PROMO_SETTINGS.unavailableMessage,
    updatedAt: plain.updatedAt,
  };
};
