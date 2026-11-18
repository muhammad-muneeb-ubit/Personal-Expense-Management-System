const express = require("express");
const router = express.Router();

const QRCode = require("../models/QRCode");

// GET all QR codes belonging to logged-in user
router.get("/", async (req, res) => {
  try {
    const qrCodes = await QRCode.find({
      userId: req.user._id,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: qrCodes,
    });
  } catch (error) {
    console.error("Fetch QR codes error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch QR codes",
    });
  }
});

// CREATE QR code record
router.post("/", async (req, res) => {
  try {
    const { url, title } = req.body;

    if (!url || typeof url !== "string") {
      return res.status(400).json({
        success: false,
        message: "URL is required",
      });
    }

    let normalizedUrl = url.trim();

    if (!/^https?:\/\//i.test(normalizedUrl)) {
      normalizedUrl = `https://${normalizedUrl}`;
    }

    try {
      new URL(normalizedUrl);
    } catch {
      return res.status(400).json({
        success: false,
        message: "Invalid URL",
      });
    }

    const qrCode = await QRCode.create({
      userId: req.user._id,
      url: normalizedUrl,
      title: title || "",
    });

    res.status(201).json({
      success: true,
      data: qrCode,
    });
  } catch (error) {
    console.error("Create QR code error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to save QR code",
    });
  }
});

// DELETE one QR code
router.delete("/:id", async (req, res) => {
  try {
    const qrCode = await QRCode.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!qrCode) {
      return res.status(404).json({
        success: false,
        message: "QR code not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "QR code deleted successfully",
    });
  } catch (error) {
    console.error("Delete QR code error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete QR code",
    });
  }
});

// DELETE all QR codes belonging to user
router.delete("/", async (req, res) => {
  try {
    await QRCode.deleteMany({
      userId: req.user._id,
    });

    res.status(200).json({
      success: true,
      message: "QR code history cleared",
    });
  } catch (error) {
    console.error("Clear QR history error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to clear QR history",
    });
  }
});

module.exports = router;