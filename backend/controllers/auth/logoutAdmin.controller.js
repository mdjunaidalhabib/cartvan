/**
 * POST /admin/logout
 */
export const logoutAdmin = async (req, res) => {
  try {
    const baseOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    };

    // 1) host-only cookie clear
    res.clearCookie("admin_token", baseOptions);
    res.cookie("admin_token", "", {
      ...baseOptions,
      expires: new Date(0),
      maxAge: 0,
    });

    // 2) old domain cookie clear, if mobile still has previous cookie
    res.clearCookie("admin_token", {
      ...baseOptions,
      domain: ".openupbd.com",
    });
    res.cookie("admin_token", "", {
      ...baseOptions,
      domain: ".openupbd.com",
      expires: new Date(0),
      maxAge: 0,
    });

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error during logout",
    });
  }
};
